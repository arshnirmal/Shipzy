import axios, { AxiosInstance, AxiosResponse, Method } from "axios";
import { faker } from "@faker-js/faker";
import fs from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_SEED_PASSWORD,
  REALISTIC_BUSINESS_NAMES,
  REALISTIC_FIRST_NAMES,
  REALISTIC_LAST_NAMES,
} from "./constants.js";
import {
  ActorAuth,
  ActionStats,
  CreateOrderCatalog,
  DrizzleModule,
  FailureEntry,
  OrderFlow,
  OrderRecord,
  RatingRecord,
  Role,
  SeedConfig,
  SeedManifest,
  TargetQuery,
} from "./types.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

const randomIndianPhone = () => `9${faker.string.numeric(9)}`.slice(0, 10);

const pickRandom = <T>(items: T[]): T => {
  const index = faker.number.int({ min: 0, max: items.length - 1 });
  return items[index] as T;
};

const chance = (numerator: number, denominator = 1000): boolean =>
  faker.number.int({ min: 1, max: denominator }) <= numerator;

export class SeedRunner {
  private readonly api: AxiosInstance;

  private readonly actionStats = new Map<string, ActionStats>();

  private readonly failures: FailureEntry[] = [];

  private readonly manifest: SeedManifest;

  private staticCatalog: CreateOrderCatalog | null = null;

  private readonly clients: ActorAuth[] = [];

  private readonly drivers: ActorAuth[] = [];

  private readonly businesses: ActorAuth[] = [];

  private readonly orders: OrderRecord[] = [];

  private readonly ratings: RatingRecord[] = [];

  private readonly unavailableDriverIds = new Set<number>();

  private drizzlePoolRef: DrizzleModule["drizzlePool"] | null = null;

  private clientOrdinal = 0;

  private courierOrdinal = 0;

  private businessOrdinal = 0;

  private recipientOrdinal = 0;

  constructor(private readonly config: SeedConfig) {
    this.api = axios.create({
      baseURL: config.apiUrl,
      validateStatus: () => true,
      headers: {
        "ngrok-skip-browser-warning": "true",
      },
    });

    this.manifest = {
      run: {
        startedAt: new Date().toISOString(),
        apiUrl: config.apiUrl,
        scenarios: config.scenarios,
        seed: config.seed,
        modules: [...config.modules],
        orderFlow: config.orderFlow,
        counts: config.counts,
        tag: config.tag,
      },
      created: {
        clients: [],
        drivers: [],
        businesses: [],
        orders: [],
        ratings: [],
        addressesIntelligence: [],
        targets: {},
      },
      failures: this.failures,
      stats: {},
    };
  }

  private track(action: string, success: boolean) {
    const current = this.actionStats.get(action) || { success: 0, failure: 0 };
    if (success) {
      current.success += 1;
    } else {
      current.failure += 1;
    }
    this.actionStats.set(action, current);
  }

  private responseSucceeded(response: AxiosResponse<any>): boolean {
    if (response.status < 200 || response.status >= 300) return false;
    const body = response.data;
    if (body && typeof body === "object" && "success" in body) {
      return body.success === true;
    }
    return true;
  }

  private describeFailure(response: AxiosResponse<any>): FailureEntry {
    const status = response.status;
    const message =
      response.data?.message ||
      response.data?.error ||
      `Request failed with HTTP ${status}`;
    const details = response.data?.errors
      ? JSON.stringify(response.data.errors)
      : undefined;
    return {
      action: "api-request",
      status,
      message: String(message),
      details,
    };
  }

  private getResponseData<T = any>(response: AxiosResponse<any>): T {
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data
    ) {
      return response.data.data as T;
    }
    return response.data as T;
  }

  private async call(
    action: string,
    method: Method,
    url: string,
    options?: {
      headers?: Record<string, string>;
      data?: unknown;
    },
  ): Promise<AxiosResponse<any> | null> {
    try {
      const response = await this.api.request({
        method,
        url,
        headers: options?.headers,
        data: options?.data,
      });

      if (this.responseSucceeded(response)) {
        this.track(action, true);
        return response;
      }

      this.track(action, false);
      const failure = this.describeFailure(response);
      failure.action = action;
      this.failures.push(failure);
      console.error(
        `❌ ${action} failed [${response.status}]: ${failure.message}`,
      );
      if (failure.details) {
        console.error(`   ↳ ${failure.details}`);
      }
      if (this.config.failFast) {
        throw new Error(`${action} failed with status ${response.status}`);
      }
      return null;
    } catch (error: any) {
      this.track(action, false);
      this.failures.push({
        action,
        message: error.message || "Unknown request error",
      });
      console.error(`❌ ${action} threw: ${error.message || "unknown error"}`);
      if (this.config.failFast) {
        throw error;
      }
      return null;
    }
  }

  private authHeaders(
    token: string,
    deviceId?: string,
  ): Record<string, string> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (deviceId) headers["X-Device-Id"] = deviceId;
    return headers;
  }

  private slugifyEmailToken(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+/, "")
      .replace(/\.+$/, "")
      .replace(/\.{2,}/g, ".");
  }

  private nextOrdinal(scope: "client" | "courier" | "business" | "recipient") {
    if (scope === "client") return (this.clientOrdinal += 1);
    if (scope === "courier") return (this.courierOrdinal += 1);
    if (scope === "business") return (this.businessOrdinal += 1);
    return (this.recipientOrdinal += 1);
  }

  private buildRealisticFullName(ordinal: number): string {
    const first =
      REALISTIC_FIRST_NAMES[
        (ordinal + this.config.seed) % REALISTIC_FIRST_NAMES.length
      ] || "Aarav";
    const last =
      REALISTIC_LAST_NAMES[
        (ordinal * 7 + this.config.seed) % REALISTIC_LAST_NAMES.length
      ] || "Sharma";
    return `${first} ${last}`;
  }

  private buildEmail(role: Role, fullName: string, ordinal: number): string {
    const tag = this.slugifyEmailToken(this.config.tag || "seed");
    const name = this.slugifyEmailToken(fullName);
    const roleToken = this.slugifyEmailToken(role);
    // Keep emails readable and unique across reruns with the same DB.
    return `${tag}.${this.config.seed}.${roleToken}.${name}.${ordinal}@shipzy.test`;
  }

  private buildPassword(): string {
    return DEFAULT_SEED_PASSWORD;
  }

  private mumbaiCoordinates() {
    const minLat = 18.89;
    const maxLat = 19.27;
    const minLng = 72.77;
    const maxLng = 72.98;
    return {
      latitude: faker.number.float({
        min: minLat,
        max: maxLat,
        fractionDigits: 6,
      }),
      longitude: faker.number.float({
        min: minLng,
        max: maxLng,
        fractionDigits: 6,
      }),
    };
  }

  private orderCoordinates() {
    const pickup = this.mumbaiCoordinates();
    let delivery = this.mumbaiCoordinates();

    for (let i = 0; i < 10; i += 1) {
      const distance =
        Math.abs(pickup.latitude - delivery.latitude) +
        Math.abs(pickup.longitude - delivery.longitude);
      if (distance > 0.02) break;
      delivery = this.mumbaiCoordinates();
    }

    return { pickup, delivery };
  }

  private async maybeDelay() {
    if (this.config.requestDelayMs > 0) {
      await delay(this.config.requestDelayMs);
    }
  }

  private async getDrizzlePool() {
    if (!this.drizzlePoolRef) {
      const module =
        (await import("../../src/database/drizzle.js")) as DrizzleModule;
      this.drizzlePoolRef = module.drizzlePool;
    }
    return this.drizzlePoolRef;
  }

  private findActorInMemory(role: Role, target: TargetQuery): ActorAuth | null {
    const list =
      role === "client"
        ? this.clients
        : role === "courier"
          ? this.drivers
          : this.businesses;
    const targetEmail = normalizeEmail(target.email);

    return (
      list.find((actor) => {
        if (target.id && actor.userId === target.id) return true;
        if (targetEmail && normalizeEmail(actor.email) === targetEmail)
          return true;
        return false;
      }) || null
    );
  }

  private async resolveExistingActor(
    role: Role,
    target: TargetQuery,
  ): Promise<ActorAuth | null> {
    if (!this.config.dbTargetLookup) return null;
    if (!target.id && !target.email) return null;

    const pool = await this.getDrizzlePool();
    const filterById = typeof target.id === "number";
    const queryText = filterById
      ? "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role = $1 AND deleted_at IS NULL AND user_id = $2 LIMIT 1"
      : "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role = $1 AND deleted_at IS NULL AND LOWER(email) = LOWER($2) LIMIT 1";

    const queryValue = filterById ? target.id : normalizeEmail(target.email);
    const result = await pool.query(queryText, [role, queryValue]);
    const row = result.rows[0];

    if (!row) {
      this.failures.push({
        action: "db.lookup.actor",
        message: `No ${role} found for provided target filter.`,
      });
      return null;
    }

    const password = target.password || DEFAULT_SEED_PASSWORD;
    const loginResponse = await this.call(
      "auth.login.target",
      "POST",
      "/auth/login",
      {
        data: {
          credentials: {
            email: row.email,
            password,
          },
        },
        headers: {
          "X-Device-Id": `${this.config.tag}-${role}-lookup-${faker.string.alphanumeric(6)}`,
        },
      },
    );

    if (!loginResponse) {
      return null;
    }

    const payload = this.getResponseData<any>(loginResponse);
    const accessToken = payload.auth.tokens.accessToken as string;

    return {
      userId: Number(row.user_id),
      email: String(row.email),
      fullName: String(row.full_name),
      phoneNumber: row.phone_number ? String(row.phone_number) : undefined,
      role,
      accessToken,
      password,
      source: "existing-db",
    };
  }

  private async ensureStaticCatalog(): Promise<CreateOrderCatalog> {
    if (this.staticCatalog) return this.staticCatalog;

    const response = await this.call(
      "static.create-order-data",
      "GET",
      "/static/create-order-data",
    );
    if (!response) {
      throw new Error("Unable to load static create-order-data payload.");
    }

    const data = this.getResponseData<any>(response);
    const catalog = data.createOrder || data;

    if (
      !Array.isArray(catalog.deliveryTypes) ||
      !Array.isArray(catalog.packageTypes) ||
      !Array.isArray(catalog.paymentMethods) ||
      catalog.deliveryTypes.length === 0 ||
      catalog.paymentMethods.length === 0
    ) {
      throw new Error("Static catalog is missing required datasets.");
    }

    this.staticCatalog = {
      deliveryTypes: catalog.deliveryTypes,
      packageTypes: catalog.packageTypes,
      paymentMethods: catalog.paymentMethods,
    };

    return this.staticCatalog;
  }

  private registerActor(actor: ActorAuth) {
    if (actor.role === "client") {
      this.clients.push(actor);
      this.manifest.created.clients.push({
        userId: actor.userId,
        fullName: actor.fullName,
        email: actor.email,
        password: actor.password,
        source: actor.source,
      });
      return;
    }

    if (actor.role === "courier") {
      this.drivers.push(actor);
      if (actor.source === "created") {
        this.unavailableDriverIds.delete(actor.userId);
      }
      this.manifest.created.drivers.push({
        userId: actor.userId,
        fullName: actor.fullName,
        email: actor.email,
        password: actor.password,
        source: actor.source,
      });
      return;
    }

    this.businesses.push(actor);
    this.manifest.created.businesses.push({
      userId: actor.userId,
      fullName: actor.fullName,
      email: actor.email,
      password: actor.password,
      source: actor.source,
    });
  }

  private async createClientActor(): Promise<ActorAuth | null> {
    const ordinal = this.nextOrdinal("client");
    const fullName = this.buildRealisticFullName(ordinal);
    const email = this.buildEmail("client", fullName, ordinal);
    const password = this.buildPassword();
    const deviceId = `${this.config.tag}-client-${faker.string.alphanumeric(6)}`;

    const response = await this.call(
      "auth.register.client",
      "POST",
      "/auth/register",
      {
        headers: { "X-Device-Id": deviceId },
        data: {
          identity: {
            fullName,
            role: "client",
            phoneNumber: randomIndianPhone(),
          },
          credentials: {
            email,
            password,
          },
        },
      },
    );

    if (!response) return null;

    const payload = this.getResponseData<any>(response);
    const user = payload.actor.user;
    const accessToken = payload.auth.tokens.accessToken as string;

    const actor: ActorAuth = {
      userId: Number(user.userId),
      email,
      fullName,
      phoneNumber: user.phoneNumber || undefined,
      role: "client",
      accessToken,
      password,
      source: "created",
    };

    this.registerActor(actor);

    const coordinates = this.mumbaiCoordinates();
    await this.call("users.address.create", "POST", "/users/me/addresses", {
      headers: this.authHeaders(accessToken),
      data: {
        fullAddress: faker.location.streetAddress({ useFullAddress: true }),
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        label: "Home",
        addressType: "home",
        building: faker.location.buildingNumber(),
        floor: faker.number.int({ min: 1, max: 30 }).toString(),
        flatNumber: faker.number.int({ min: 1, max: 999 }).toString(),
        landmark: faker.location.street(),
      },
    });

    return actor;
  }

  private async createDriverActor(): Promise<ActorAuth | null> {
    const ordinal = this.nextOrdinal("courier");
    const fullName = this.buildRealisticFullName(ordinal);
    const email = this.buildEmail("courier", fullName, ordinal);
    const password = this.buildPassword();
    const deviceId = `${this.config.tag}-courier-${faker.string.alphanumeric(6)}`;

    const response = await this.call(
      "auth.register.courier",
      "POST",
      "/auth/register",
      {
        headers: { "X-Device-Id": deviceId },
        data: {
          identity: {
            fullName,
            role: "courier",
            phoneNumber: randomIndianPhone(),
          },
          credentials: {
            email,
            password,
          },
        },
      },
    );

    if (!response) return null;

    const payload = this.getResponseData<any>(response);
    const user = payload.actor.user;
    const accessToken = payload.auth.tokens.accessToken as string;

    const actor: ActorAuth = {
      userId: Number(user.userId),
      email,
      fullName,
      phoneNumber: user.phoneNumber || undefined,
      role: "courier",
      accessToken,
      password,
      source: "created",
    };

    this.registerActor(actor);

    await this.call("drivers.profile.update", "PATCH", "/drivers/me", {
      headers: this.authHeaders(accessToken),
      data: {
        profile: {
          profilePictureUrl: faker.image.avatar(),
        },
      },
    });

    const location = this.mumbaiCoordinates();
    await this.call(
      "drivers.location.update",
      "PATCH",
      "/drivers/me/location",
      {
        headers: this.authHeaders(accessToken),
        data: {
          location: {
            current: location,
          },
        },
      },
    );

    await this.call(
      "drivers.availability.update",
      "PATCH",
      "/drivers/me/availability",
      {
        headers: this.authHeaders(accessToken),
        data: {
          availability: {
            isAvailable: true,
            isOnline: true,
          },
          tracking: {
            currentLocation: location,
          },
        },
      },
    );

    return actor;
  }

  private async createBusinessActor(): Promise<ActorAuth | null> {
    const ordinal = this.nextOrdinal("business");
    const fullName = this.buildRealisticFullName(ordinal);
    const email = this.buildEmail("business", fullName, ordinal);
    const password = this.buildPassword();
    const deviceId = `${this.config.tag}-business-${faker.string.alphanumeric(6)}`;
    const monthlyVolumes = ["0-100", "100-500", "500-2000", "2000+"];

    const businessName =
      REALISTIC_BUSINESS_NAMES[
        (ordinal + this.config.seed) % REALISTIC_BUSINESS_NAMES.length
      ] || "Mehta Grocery";

    const response = await this.call(
      "auth.register.business",
      "POST",
      "/auth/register/business",
      {
        headers: { "X-Device-Id": deviceId },
        data: {
          identity: {
            fullName,
            phoneNumber: randomIndianPhone(),
          },
          credentials: {
            email,
            password,
          },
          business: {
            businessName,
            gstNumber: `${faker.string.alpha({ length: 5, casing: "upper" })}${faker.string.numeric(6)}`,
            monthlyVolume: pickRandom(monthlyVolumes),
          },
        },
      },
    );

    if (!response) return null;

    const payload = this.getResponseData<any>(response);
    const user = payload.actor.user;
    const accessToken = payload.auth.tokens.accessToken as string;

    const actor: ActorAuth = {
      userId: Number(user.userId),
      email,
      fullName,
      phoneNumber: user.phoneNumber || undefined,
      role: "business",
      accessToken,
      password,
      source: "created",
    };

    this.registerActor(actor);
    return actor;
  }

  private async ensureClientForOrders(): Promise<ActorAuth | null> {
    const targetMemory = this.findActorInMemory(
      "client",
      this.config.targetClient,
    );
    if (targetMemory) return targetMemory;

    if (this.config.targetClient.id || this.config.targetClient.email) {
      const target = await this.resolveExistingActor(
        "client",
        this.config.targetClient,
      );
      if (target) {
        this.registerActor(target);
        this.manifest.created.targets.client = {
          userId: target.userId,
          email: target.email,
          source: target.source,
        };
        return target;
      }
      return null;
    }

    if (this.clients.length > 0) return pickRandom(this.clients);

    return this.createClientActor();
  }

  private async ensureDriverForOrders(): Promise<ActorAuth | null> {
    const targetMemory = this.findActorInMemory(
      "courier",
      this.config.targetDriver,
    );
    if (targetMemory) return targetMemory;

    if (this.config.targetDriver.id || this.config.targetDriver.email) {
      const target = await this.resolveExistingActor(
        "courier",
        this.config.targetDriver,
      );
      if (target) {
        this.registerActor(target);
        this.manifest.created.targets.driver = {
          userId: target.userId,
          email: target.email,
          source: target.source,
        };
        return target;
      }
      return null;
    }

    if (this.drivers.length > 0) return pickRandom(this.drivers);

    return this.createDriverActor();
  }

  private async pickDriverForAcceptance(): Promise<ActorAuth | null> {
    if (this.config.targetDriver.id || this.config.targetDriver.email) {
      const target = await this.ensureDriverForOrders();
      if (!target) return null;
      if (this.unavailableDriverIds.has(target.userId)) return null;
      return target;
    }

    const availableDrivers = this.drivers.filter(
      (driver) => !this.unavailableDriverIds.has(driver.userId),
    );

    if (availableDrivers.length === 0) return null;

    const shuffled = [...availableDrivers].sort(() =>
      faker.number.int({ min: -1, max: 1 }),
    );

    return shuffled[0] || null;
  }

  private async acceptOrderSmart(orderId: number): Promise<ActorAuth | null> {
    const attempts =
      this.config.targetDriver.id || this.config.targetDriver.email
        ? 1
        : this.drivers.length || 1;

    for (let i = 0; i < attempts; i += 1) {
      const driver = await this.pickDriverForAcceptance();
      if (!driver) {
        this.track("orders.accept.skipped.no_available_driver", true);
        return null;
      }

      const response = await this.api.request({
        method: "POST",
        url: `/orders/${orderId}/accept`,
        headers: this.authHeaders(driver.accessToken),
        data: {},
      });

      if (this.responseSucceeded(response)) {
        this.track("orders.accept", true);
        this.unavailableDriverIds.add(driver.userId);
        return driver;
      }

      const message = String(
        response.data?.message || response.data?.error || "Order accept failed",
      );

      if (
        response.status === 400 &&
        message.toLowerCase().includes("courier not available")
      ) {
        this.unavailableDriverIds.add(driver.userId);
        this.track("orders.accept.skipped.unavailable_driver", true);
        continue;
      }

      this.track("orders.accept", false);
      const failure = this.describeFailure(response);
      failure.action = "orders.accept";
      this.failures.push(failure);
      console.error(
        `❌ orders.accept failed [${response.status}]: ${failure.message}`,
      );

      if (this.config.failFast) {
        throw new Error(`orders.accept failed with status ${response.status}`);
      }
      return null;
    }

    this.track("orders.accept.skipped.no_available_driver", true);
    return null;
  }

  private async seedUsers() {
    console.log(`\n🌱 Seeding users (${this.config.counts.users})`);
    for (let i = 0; i < this.config.counts.users; i += 1) {
      await this.createClientActor();
      await this.maybeDelay();
    }
  }

  private async seedDrivers() {
    console.log(`\n🚚 Seeding drivers (${this.config.counts.drivers})`);
    for (let i = 0; i < this.config.counts.drivers; i += 1) {
      await this.createDriverActor();
      await this.maybeDelay();
    }
  }

  private async seedBusinesses() {
    console.log(`\n🏢 Seeding businesses (${this.config.counts.businesses})`);
    for (let i = 0; i < this.config.counts.businesses; i += 1) {
      await this.createBusinessActor();
      await this.maybeDelay();
    }
  }

  private async calculateFare(
    client: ActorAuth,
    fulfillment: {
      deliveryTypeId: number;
      vehicleCategoryId: number;
      weightTierId: number;
      packageTypeId?: number;
    },
    pickup: { latitude: number; longitude: number },
    delivery: { latitude: number; longitude: number },
  ) {
    const response = await this.call(
      "orders.calculate-fare",
      "POST",
      "/orders/calculate-fare",
      {
        headers: this.authHeaders(client.accessToken),
        data: {
          fulfillment,
          locations: {
            pickup,
            delivery,
          },
        },
      },
    );

    if (!response) return null;
    const data = this.getResponseData<any>(response);
    return data.pricing || null;
  }

  private async createOrderWithFlow(
    client: ActorAuth,
  ): Promise<OrderRecord | null> {
    const catalog = await this.ensureStaticCatalog();

    const deliveryType = pickRandom(catalog.deliveryTypes);
    const supportedVehicles = Array.isArray(deliveryType.supportedVehicles)
      ? deliveryType.supportedVehicles
      : [];
    if (supportedVehicles.length === 0) {
      this.failures.push({
        action: "orders.select-vehicle",
        message: "No supported vehicles configured for selected delivery type.",
      });
      return null;
    }

    const vehicle = pickRandom(supportedVehicles);
    const weightTiers = Array.isArray(vehicle.weightTiers)
      ? vehicle.weightTiers
      : [];
    if (weightTiers.length === 0) {
      this.failures.push({
        action: "orders.select-weight-tier",
        message: "No weight tiers configured for selected vehicle category.",
      });
      return null;
    }

    const weightTier = pickRandom(weightTiers);
    const packageType =
      catalog.packageTypes.length > 0 ? pickRandom(catalog.packageTypes) : null;
    const activePaymentMethods = catalog.paymentMethods.filter(
      (method: any) => method?.isActive !== false,
    );
    const paymentMethod =
      activePaymentMethods.length > 0
        ? pickRandom(activePaymentMethods)
        : catalog.paymentMethods[0];

    const coordinates = this.orderCoordinates();

    const pricing = await this.calculateFare(
      client,
      {
        deliveryTypeId: Number(deliveryType.deliveryTypeId),
        vehicleCategoryId: Number(vehicle.categoryId),
        weightTierId: Number(weightTier.tierId),
        packageTypeId: packageType
          ? Number(packageType.packageTypeId)
          : undefined,
      },
      coordinates.pickup,
      coordinates.delivery,
    );

    if (!pricing) return null;

    const createResponse = await this.call("orders.create", "POST", "/orders", {
      headers: this.authHeaders(client.accessToken),
      data: {
        fulfillment: {
          deliveryTypeId: Number(deliveryType.deliveryTypeId),
          vehicleCategoryId: Number(vehicle.categoryId),
          weightTierId: Number(weightTier.tierId),
          packageTypeId: packageType ? Number(packageType.packageTypeId) : null,
          paymentMethodId: Number(paymentMethod.methodId),
        },
        locations: {
          pickup: {
            fullAddress:
              faker.location.streetAddress({ useFullAddress: true }) +
              ", Mumbai",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400001",
            latitude: coordinates.pickup.latitude,
            longitude: coordinates.pickup.longitude,
            contactName: client.fullName,
            contactPhone: client.phoneNumber || randomIndianPhone(),
            building: faker.location.buildingNumber(),
            floor: faker.number.int({ min: 1, max: 20 }).toString(),
            flatNumber: faker.number.int({ min: 1, max: 999 }).toString(),
            landmark: faker.location.street(),
          },
          delivery: {
            fullAddress:
              faker.location.streetAddress({ useFullAddress: true }) +
              ", Mumbai",
            city: "Mumbai",
            state: "Maharashtra",
            postalCode: "400058",
            latitude: coordinates.delivery.latitude,
            longitude: coordinates.delivery.longitude,
            contactName: this.buildRealisticFullName(
              this.nextOrdinal("recipient"),
            ),
            contactPhone: randomIndianPhone(),
            building: faker.location.buildingNumber(),
            floor: faker.number.int({ min: 1, max: 25 }).toString(),
            flatNumber: faker.number.int({ min: 1, max: 999 }).toString(),
            landmark: faker.location.street(),
          },
        },
        package: {
          description: faker.commerce.productDescription(),
          specialInstructions: faker.helpers.arrayElement([
            "Call on arrival",
            "Ring once",
            "Leave at reception",
          ]),
          declaredValue: faker.number.int({ min: 100, max: 5000 }),
          notifyRecipientSms: chance(500),
        },
        schedule: {
          pickupAt: null,
          deliveryAt: null,
        },
        pricing,
        couponCode: null,
        items: [
          {
            itemName: faker.commerce.productName(),
            quantity: faker.number.int({ min: 1, max: 3 }),
            weightKg: faker.number.float({
              min: 0.2,
              max: 4.5,
              fractionDigits: 1,
            }),
          },
        ],
      },
    });

    if (!createResponse) return null;

    const orderData = this.getResponseData<any>(createResponse).order;
    const orderId = Number(orderData?.identifiers?.orderId);

    if (!orderId) {
      this.failures.push({
        action: "orders.create",
        message: "Create order response missing identifiers.orderId",
      });
      return null;
    }

    const record: OrderRecord = {
      orderId,
      orderNumber: orderData?.identifiers?.orderNumber,
      status: String(orderData?.status || "pending"),
      clientUserId: client.userId,
    };

    await this.applyOrderFlow(record, client);

    this.orders.push(record);
    this.manifest.created.orders.push({
      orderId: record.orderId,
      orderNumber: record.orderNumber,
      status: record.status,
      clientUserId: record.clientUserId,
      courierUserId: record.courierUserId || null,
    });

    return record;
  }

  private async applyOrderFlow(order: OrderRecord, client: ActorAuth) {
    if (this.config.orderFlow === "pending") {
      return;
    }

    if (this.config.orderFlow === "mixed" && chance(170)) {
      const cancelResponse = await this.call(
        "orders.cancel",
        "POST",
        `/orders/${order.orderId}/cancel`,
        {
          headers: this.authHeaders(client.accessToken),
          data: {
            cancellation: {
              reason: faker.helpers.arrayElement([
                "Plan changed",
                "Wrong address",
                "No longer required",
              ]),
            },
          },
        },
      );

      if (cancelResponse) {
        order.status = "cancelled";
      }
      return;
    }

    const driver = await this.acceptOrderSmart(order.orderId);
    if (!driver) return;

    order.courierUserId = driver.userId;
    order.status = "accepted";

    const shouldDeliver =
      this.config.orderFlow === "delivered" ||
      (this.config.orderFlow === "mixed" && chance(700));

    if (!shouldDeliver) {
      if (this.config.orderFlow === "mixed" && chance(500)) {
        const pickedUpOnly = await this.call(
          "orders.status.picked_up",
          "PATCH",
          `/orders/${order.orderId}/status`,
          {
            headers: this.authHeaders(driver.accessToken),
            data: { transition: { status: "picked_up" } },
          },
        );
        if (pickedUpOnly) order.status = "picked_up";
      }
      return;
    }

    const pickedUp = await this.call(
      "orders.status.picked_up",
      "PATCH",
      `/orders/${order.orderId}/status`,
      {
        headers: this.authHeaders(driver.accessToken),
        data: { transition: { status: "picked_up" } },
      },
    );
    if (!pickedUp) return;
    order.status = "picked_up";

    const inTransit = await this.call(
      "orders.status.in_transit",
      "PATCH",
      `/orders/${order.orderId}/status`,
      {
        headers: this.authHeaders(driver.accessToken),
        data: { transition: { status: "in_transit" } },
      },
    );
    if (!inTransit) return;
    order.status = "in_transit";

    const delivered = await this.call(
      "orders.status.delivered",
      "PATCH",
      `/orders/${order.orderId}/status`,
      {
        headers: this.authHeaders(driver.accessToken),
        data: { transition: { status: "delivered" } },
      },
    );
    if (!delivered) return;
    order.status = "delivered";
  }

  private async seedOrders() {
    console.log(
      `\n📦 Seeding orders (${this.config.counts.orders}) [flow=${this.config.orderFlow}]`,
    );
    await this.ensureStaticCatalog();

    for (let i = 0; i < this.config.counts.orders; i += 1) {
      const targetClient = await this.ensureClientForOrders();
      if (!targetClient) {
        this.failures.push({
          action: "orders.prepare.client",
          message: "Unable to resolve a client for order creation.",
        });
        if (this.config.failFast) {
          throw new Error("No client available for order seeding.");
        }
        continue;
      }

      await this.createOrderWithFlow(targetClient);
      await this.maybeDelay();
    }
  }

  private async ensureDeliveredOrders(count: number) {
    const deliveredOrders = this.orders.filter(
      (order) => order.status === "delivered",
    );
    if (deliveredOrders.length >= count) return;

    const needed = count - deliveredOrders.length;
    const originalFlow = this.config.orderFlow;
    (this.config as { orderFlow: OrderFlow }).orderFlow = "delivered";

    try {
      for (let i = 0; i < needed; i += 1) {
        const client = await this.ensureClientForOrders();
        if (!client) break;
        await this.createOrderWithFlow(client);
      }
    } finally {
      (this.config as { orderFlow: OrderFlow }).orderFlow = originalFlow;
    }
  }

  private getClientByUserId(userId: number): ActorAuth | null {
    return this.clients.find((client) => client.userId === userId) || null;
  }

  private async seedRatings() {
    console.log(`\n⭐ Seeding ratings (${this.config.counts.ratings})`);

    await this.ensureDeliveredOrders(this.config.counts.ratings);

    const deliveredOrders = this.orders.filter(
      (order) => order.status === "delivered",
    );
    const shuffled = [...deliveredOrders].sort(() =>
      faker.number.int({ min: -1, max: 1 }),
    );

    let created = 0;
    for (const order of shuffled) {
      if (created >= this.config.counts.ratings) break;
      const client = this.getClientByUserId(order.clientUserId);
      if (!client) continue;

      const score = faker.number.int({ min: 3, max: 5 });
      const response = await this.call(
        "ratings.create",
        "POST",
        `/ratings/orders/${order.orderId}`,
        {
          headers: this.authHeaders(client.accessToken),
          data: {
            feedback: {
              score,
              comment: faker.helpers.arrayElement([
                "Great delivery",
                "Smooth experience",
                "Courier was on time",
              ]),
              anonymous: chance(300),
            },
          },
        },
      );

      if (!response) continue;

      const ratingData = this.getResponseData<any>(response).rating;
      const record: RatingRecord = {
        orderId: Number(ratingData.orderId),
        driverId: Number(ratingData.driverId),
        customerId: Number(ratingData.customerId),
        rating: Number(ratingData.rating),
      };
      this.ratings.push(record);
      this.manifest.created.ratings.push(record);
      created += 1;
      await this.maybeDelay();
    }
  }

  private async runAddressIntelligence() {
    console.log("\n🗺️ Running address intelligence calls");

    let actor =
      this.clients[0] || this.drivers[0] || this.businesses[0] || null;
    if (!actor) {
      actor = await this.createClientActor();
    }

    if (!actor) {
      this.failures.push({
        action: "addresses.prepare.actor",
        message: "Unable to resolve actor for addresses module.",
      });
      return;
    }

    const searchResponse = await this.call(
      "addresses.search",
      "POST",
      "/addresses/search",
      {
        headers: this.authHeaders(actor.accessToken),
        data: {
          query: "Andheri East",
          country: "IN",
          limit: 5,
        },
      },
    );

    const searchData = searchResponse
      ? this.getResponseData<any>(searchResponse).search
      : null;
    const suggestions = Array.isArray(searchData?.suggestions)
      ? searchData.suggestions
      : [];

    if (suggestions.length > 0 && searchData?.sessionToken) {
      await this.call("addresses.retrieve", "POST", "/addresses/retrieve", {
        headers: this.authHeaders(actor.accessToken),
        data: {
          mapboxId: suggestions[0].mapboxId,
          sessionToken: searchData.sessionToken,
        },
      });
    }

    const referencePoint = this.mumbaiCoordinates();

    await this.call(
      "addresses.reverse-geocode",
      "POST",
      "/addresses/reverse-geocode",
      {
        headers: this.authHeaders(actor.accessToken),
        data: {
          latitude: referencePoint.latitude,
          longitude: referencePoint.longitude,
        },
      },
    );

    const destination = this.mumbaiCoordinates();
    await this.call("addresses.directions", "POST", "/addresses/directions", {
      headers: this.authHeaders(actor.accessToken),
      data: {
        origin: {
          latitude: referencePoint.latitude,
          longitude: referencePoint.longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        profile: "driving",
      },
    });

    await this.call("addresses.distance", "POST", "/addresses/distance", {
      headers: this.authHeaders(actor.accessToken),
      data: {
        lat1: referencePoint.latitude,
        lon1: referencePoint.longitude,
        lat2: destination.latitude,
        lon2: destination.longitude,
      },
    });

    this.manifest.created.addressesIntelligence.push({
      actorUserId: actor.userId,
      actorRole: actor.role,
      executedAt: new Date().toISOString(),
      searchSuggestions: suggestions.length,
    });
  }

  private async runStaticModule() {
    console.log("\n📚 Loading static catalog");
    await this.ensureStaticCatalog();
  }

  private printSummary(manifestPath: string) {
    console.log("\n📈 Seed summary");
    const rows = [...this.actionStats.entries()].map(([action, stats]) => ({
      action,
      ...stats,
    }));
    rows.sort(
      (a, b) => b.failure - a.failure || a.action.localeCompare(b.action),
    );

    if (rows.length === 0) {
      console.log("   No API actions were executed.");
    }

    for (const row of rows) {
      const total = row.success + row.failure;
      const icon = row.failure > 0 ? "⚠️" : "✅";
      console.log(
        `   ${icon} ${row.action}: ${row.success}/${total} succeeded`,
      );
    }

    const totalFailures = this.failures.length;
    console.log(`\n   Clients created: ${this.clients.length}`);
    console.log(`   Drivers created: ${this.drivers.length}`);
    console.log(`   Businesses created: ${this.businesses.length}`);
    console.log(`   Orders created: ${this.orders.length}`);
    console.log(`   Ratings created: ${this.ratings.length}`);
    console.log(`   Failures captured: ${totalFailures}`);
    console.log(`   Manifest: ${manifestPath}`);
  }

  private async writeManifest() {
    for (const [action, stats] of this.actionStats.entries()) {
      this.manifest.stats[action] = stats;
    }

    (this.manifest.run as any).completedAt = new Date().toISOString();

    const directory = path.dirname(this.config.manifestFile);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(
      this.config.manifestFile,
      JSON.stringify(this.manifest, null, 2),
      "utf-8",
    );
  }

  async run() {
    faker.seed(this.config.seed);

    if (this.config.modules.has("static")) {
      await this.runStaticModule();
    }

    if (this.config.modules.has("users")) {
      await this.seedUsers();
    }

    if (this.config.modules.has("drivers")) {
      await this.seedDrivers();
    }

    if (this.config.modules.has("businesses")) {
      await this.seedBusinesses();
    }

    if (this.config.modules.has("orders")) {
      await this.seedOrders();
    }

    if (this.config.modules.has("ratings")) {
      await this.seedRatings();
    }

    if (this.config.modules.has("addresses")) {
      await this.runAddressIntelligence();
    }

    await this.writeManifest();
    this.printSummary(this.config.manifestFile);
  }

  async cleanup() {
    if (this.drizzlePoolRef) {
      await this.drizzlePoolRef.end();
      this.drizzlePoolRef = null;
    }
  }
}
