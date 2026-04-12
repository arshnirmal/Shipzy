import axios, { AxiosInstance, AxiosResponse, Method } from "axios";
import { faker } from "@faker-js/faker";
import fs from "node:fs/promises";
import path from "node:path";

type Role = "client" | "courier" | "business";
type OrderFlow = "pending" | "mixed" | "delivered";
type ModuleName =
  | "static"
  | "users"
  | "drivers"
  | "businesses"
  | "orders"
  | "ratings"
  | "addresses"
  | "health";
type ScenarioName =
  | "frontend-user"
  | "frontend-driver"
  | "frontend-business"
  | "frontend-all"
  | "api-smoke";

type ActionStats = { success: number; failure: number };

type TargetQuery = {
  id?: number;
  email?: string;
  password?: string;
};

type ActorAuth = {
  userId: number;
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  accessToken: string;
  password: string;
  source: "created" | "existing-db";
};

type OrderRecord = {
  orderId: number;
  orderNumber?: string;
  status: string;
  clientUserId: number;
  courierUserId?: number;
};

type RatingRecord = {
  orderId: number;
  driverId: number;
  customerId: number;
  rating: number;
};

type FailureEntry = {
  action: string;
  status?: number;
  message: string;
  details?: string;
};

type SeedConfig = {
  apiUrl: string;
  seed: number;
  scenarios: ScenarioName[];
  modules: Set<ModuleName>;
  orderFlow: OrderFlow;
  failFast: boolean;
  dryRun: boolean;
  dbTargetLookup: boolean;
  requestDelayMs: number;
  counts: {
    users: number;
    drivers: number;
    businesses: number;
    orders: number;
    ratings: number;
  };
  targetClient: TargetQuery;
  targetDriver: TargetQuery;
  manifestFile: string;
  tag: string;
};

type CreateOrderCatalog = {
  deliveryTypes: any[];
  packageTypes: any[];
  paymentMethods: any[];
};

type DrizzleModule = {
  drizzlePool: {
    query: (queryText: string, values: unknown[]) => Promise<{ rows: any[] }>;
    end: () => Promise<void>;
  };
};

const DEFAULT_API_URL =
  process.env.API_URL ||
  `http://${process.env.BACKEND_HOST || "localhost"}:${process.env.BACKEND_PORT || "3000"}/api/v1`;

const DEFAULT_COUNTS = {
  users: 3,
  drivers: 2,
  businesses: 2,
  orders: 6,
  ratings: 3,
};

const HELP_TEXT = `
Shipzy API Seeder

Usage:
  pnpm run db:seed -- [flags]

Scenarios:
  --scenarios frontend-all
  --scenarios frontend-user,frontend-driver

Modules (can be combined):
  --modules static,users,drivers,businesses,orders,addresses
  --modules ratings   # ratings are opt-in only

Core Flags:
  --api-url <url>                     API base URL (default from env)
  --seed <number>                     Seed for deterministic faker data
  --tag <string>                      Tag prefix for generated emails
  --manifest-file <path>              Where to write output manifest JSON
  --dry-run                           Print plan and exit
  --fail-fast                         Stop immediately on first failure

Counts:
  --count-users <n>
  --count-drivers <n>
  --count-businesses <n>
  --count-orders <n>
  --count-ratings <n>

Order Flow:
  --order-flow pending|mixed|delivered

Optional Modules:
  --enable-ratings                    Adds ratings module
  --enable-address-intelligence       Adds addresses module

Targeting (for orders/driver actions):
  --target-client-id <id>
  --target-client-email <email>
  --target-client-password <password>
  --target-driver-id <id>
  --target-driver-email <email>
  --target-driver-password <password>
  --db-target-lookup                  Allows DB lookup for target client/driver only

Examples:
  pnpm run db:seed -- --scenarios frontend-all
  pnpm run db:seed -- --modules users,drivers,orders --order-flow mixed --count-orders 10
  pnpm run db:seed -- --modules orders --target-client-email alice@shipzy.test --target-client-password Password123! --db-target-lookup
  pnpm run db:seed -- --modules ratings --enable-ratings --count-ratings 5
`.trim();

const SCENARIO_MODULES: Record<ScenarioName, ModuleName[]> = {
  "frontend-user": ["static", "users", "orders"],
  "frontend-driver": ["static", "drivers", "orders"],
  "frontend-business": ["static", "businesses"],
  "frontend-all": [
    "static",
    "users",
    "drivers",
    "businesses",
    "orders",
    "addresses",
    "health",
  ],
  "api-smoke": ["static", "addresses", "health"],
};

const VALID_MODULES: ModuleName[] = [
  "static",
  "users",
  "drivers",
  "businesses",
  "orders",
  "ratings",
  "addresses",
  "health",
];

const VALID_SCENARIOS: ScenarioName[] = [
  "frontend-user",
  "frontend-driver",
  "frontend-business",
  "frontend-all",
  "api-smoke",
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeEmail = (value?: string): string | undefined => {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : undefined;
};

const formatNow = () => new Date().toISOString().replace(/[:.]/g, "-");

const parseIntArg = (flag: string, value: string): number => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`${flag} expects a positive integer.`);
  }
  return parsed;
};

const parseCsv = (value: string): string[] =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

const randomIndianPhone = () => `9${faker.string.numeric(9)}`.slice(0, 10);

const pickRandom = <T>(items: T[]): T => {
  const index = faker.number.int({ min: 0, max: items.length - 1 });
  return items[index] as T;
};

const chance = (numerator: number, denominator = 1000): boolean =>
  faker.number.int({ min: 1, max: denominator }) <= numerator;

const scenarioLabel = (scenarios: ScenarioName[]) =>
  scenarios.length ? scenarios.join(",") : "none";

const parseArgs = (argv: string[]): SeedConfig & { help: boolean } => {
  const scenarios = new Set<ScenarioName>();
  const modules = new Set<ModuleName>();

  const config: SeedConfig & { help: boolean } = {
    apiUrl: DEFAULT_API_URL,
    seed: 42,
    scenarios: [],
    modules,
    orderFlow: "mixed",
    failFast: false,
    dryRun: false,
    dbTargetLookup: false,
    requestDelayMs: 150,
    counts: {
      ...DEFAULT_COUNTS,
    },
    targetClient: {},
    targetDriver: {},
    manifestFile: path.resolve(
      process.cwd(),
      "scripts/output",
      `seed-manifest-${formatNow()}.json`,
    ),
    tag: "seed",
    help: false,
  };

  const requireNext = (index: number, flag: string): string => {
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      throw new Error(`${flag} requires a value.`);
    }
    return next;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    switch (arg) {
      case "--help":
      case "-h":
        config.help = true;
        break;
      case "--api-url":
        config.apiUrl = requireNext(i, arg);
        i += 1;
        break;
      case "--seed":
        config.seed = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--tag":
        config.tag = requireNext(i, arg).trim() || "seed";
        i += 1;
        break;
      case "--manifest-file":
        config.manifestFile = path.resolve(process.cwd(), requireNext(i, arg));
        i += 1;
        break;
      case "--request-delay-ms":
        config.requestDelayMs = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--count-users":
        config.counts.users = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--count-drivers":
        config.counts.drivers = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--count-businesses":
        config.counts.businesses = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--count-orders":
        config.counts.orders = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--count-ratings":
        config.counts.ratings = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--order-flow": {
        const flow = requireNext(i, arg) as OrderFlow;
        if (!["pending", "mixed", "delivered"].includes(flow)) {
          throw new Error(`${arg} must be one of pending|mixed|delivered.`);
        }
        config.orderFlow = flow;
        i += 1;
        break;
      }
      case "--scenarios": {
        const values = parseCsv(requireNext(i, arg));
        for (const item of values) {
          if (!VALID_SCENARIOS.includes(item as ScenarioName)) {
            throw new Error(
              `Invalid scenario '${item}'. Valid values: ${VALID_SCENARIOS.join(", ")}`,
            );
          }
          scenarios.add(item as ScenarioName);
        }
        i += 1;
        break;
      }
      case "--modules": {
        const values = parseCsv(requireNext(i, arg));
        for (const item of values) {
          if (!VALID_MODULES.includes(item as ModuleName)) {
            throw new Error(
              `Invalid module '${item}'. Valid values: ${VALID_MODULES.join(", ")}`,
            );
          }
          modules.add(item as ModuleName);
        }
        i += 1;
        break;
      }
      case "--enable-ratings":
        modules.add("ratings");
        break;
      case "--enable-address-intelligence":
        modules.add("addresses");
        break;
      case "--target-client-id":
        config.targetClient.id = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--target-client-email":
        config.targetClient.email = normalizeEmail(requireNext(i, arg));
        i += 1;
        break;
      case "--target-client-password":
        config.targetClient.password = requireNext(i, arg);
        i += 1;
        break;
      case "--target-driver-id":
        config.targetDriver.id = parseIntArg(arg, requireNext(i, arg));
        i += 1;
        break;
      case "--target-driver-email":
        config.targetDriver.email = normalizeEmail(requireNext(i, arg));
        i += 1;
        break;
      case "--target-driver-password":
        config.targetDriver.password = requireNext(i, arg);
        i += 1;
        break;
      case "--db-target-lookup":
        config.dbTargetLookup = true;
        break;
      case "--fail-fast":
        config.failFast = true;
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      default:
        throw new Error(
          `Unknown argument '${arg}'. Use --help to see available flags.`,
        );
    }
  }

  if (scenarios.size === 0 && modules.size === 0) {
    scenarios.add("frontend-all");
  }

  for (const scenario of scenarios) {
    for (const moduleName of SCENARIO_MODULES[scenario]) {
      modules.add(moduleName);
    }
  }

  if (modules.has("ratings") && !modules.has("orders")) {
    modules.add("orders");
  }

  if (
    (config.targetClient.id || config.targetClient.email) &&
    !modules.has("orders")
  ) {
    throw new Error(
      "Target client flags are only valid when 'orders' module is selected.",
    );
  }

  if (
    (config.targetDriver.id || config.targetDriver.email) &&
    !modules.has("orders")
  ) {
    throw new Error(
      "Target driver flags are only valid when 'orders' module is selected.",
    );
  }

  if (
    (config.targetClient.id ||
      config.targetClient.email ||
      config.targetDriver.id ||
      config.targetDriver.email) &&
    !config.dbTargetLookup
  ) {
    console.warn(
      "⚠️ Target flags were provided without --db-target-lookup. Existing actor lookup is disabled.",
    );
  }

  config.scenarios = [...scenarios];

  return config;
};

class SeedRunner {
  private readonly api: AxiosInstance;

  private readonly actionStats = new Map<string, ActionStats>();

  private readonly failures: FailureEntry[] = [];

  private readonly manifest: {
    run: Record<string, unknown>;
    created: {
      clients: Array<Record<string, unknown>>;
      drivers: Array<Record<string, unknown>>;
      businesses: Array<Record<string, unknown>>;
      orders: Array<Record<string, unknown>>;
      ratings: Array<Record<string, unknown>>;
      addressesIntelligence: Array<Record<string, unknown>>;
      targets: {
        client?: Record<string, unknown>;
        driver?: Record<string, unknown>;
      };
    };
    failures: FailureEntry[];
    stats: Record<string, ActionStats>;
  };

  private staticCatalog: CreateOrderCatalog | null = null;

  private readonly clients: ActorAuth[] = [];

  private readonly drivers: ActorAuth[] = [];

  private readonly businesses: ActorAuth[] = [];

  private readonly orders: OrderRecord[] = [];

  private readonly ratings: RatingRecord[] = [];

  private drizzlePoolRef: DrizzleModule["drizzlePool"] | null = null;

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

  private buildEmail(prefix: string): string {
    const token = faker.string.alphanumeric(8).toLowerCase();
    return `${this.config.tag}.${prefix}.${Date.now()}.${token}@shipzy.test`;
  }

  private buildPassword(): string {
    return `Shipzy!${faker.string.alphanumeric(10)}`;
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
        (await import("../src/database/drizzle.js")) as DrizzleModule;
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

    const password = target.password || "Password123!";
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
    const email = this.buildEmail("client");
    const password = this.buildPassword();
    const fullName = faker.person.fullName();
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
    const email = this.buildEmail("courier");
    const password = this.buildPassword();
    const fullName = faker.person.fullName();
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
    const email = this.buildEmail("business");
    const password = this.buildPassword();
    const fullName = faker.person.fullName();
    const deviceId = `${this.config.tag}-business-${faker.string.alphanumeric(6)}`;
    const monthlyVolumes = ["0-100", "100-500", "500-2000", "2000+"];

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
            businessName: faker.company.name(),
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
            contactName: faker.person.fullName(),
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

    const driver = await this.ensureDriverForOrders();
    if (!driver) return;

    const acceptResponse = await this.call(
      "orders.accept",
      "POST",
      `/orders/${order.orderId}/accept`,
      {
        headers: this.authHeaders(driver.accessToken),
        data: {},
      },
    );

    if (!acceptResponse) return;

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

  private async runHealthChecks() {
    console.log("\n🩺 Running health checks");
    const base = this.config.apiUrl.endsWith("/api/v1")
      ? this.config.apiUrl.slice(0, -"/api/v1".length)
      : this.config.apiUrl;
    await this.call("health.public", "GET", `${base}/health`);
    await this.call("health.internal", "GET", `${base}/_internal/health`);
    await this.call("health.api", "GET", "/");
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

    if (this.config.dryRun) {
      console.log("\n🧪 Dry-run plan");
      console.log(
        JSON.stringify(
          {
            apiUrl: this.config.apiUrl,
            modules: [...this.config.modules],
            counts: this.config.counts,
            orderFlow: this.config.orderFlow,
            targetClient: this.config.targetClient,
            targetDriver: this.config.targetDriver,
            dbTargetLookup: this.config.dbTargetLookup,
            manifestFile: this.config.manifestFile,
          },
          null,
          2,
        ),
      );
      return;
    }

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

    if (this.config.modules.has("health")) {
      await this.runHealthChecks();
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

async function main() {
  try {
    const args = process.argv.slice(2);
    const config = parseArgs(args);

    if (config.help) {
      console.log(HELP_TEXT);
      return;
    }

    console.log("🚀 Shipzy API seeding started");
    console.log(`   API URL: ${config.apiUrl}`);
    console.log(`   Scenarios: ${scenarioLabel(config.scenarios)}`);
    console.log(`   Modules: ${[...config.modules].join(", ")}`);
    console.log(`   Seed: ${config.seed}`);

    const runner = new SeedRunner(config);
    try {
      await runner.run();
      console.log("\n✨ Seed execution completed.");
    } finally {
      await runner.cleanup();
    }
  } catch (error: any) {
    console.error(
      `\n💥 Seed script failed: ${error.message || "Unknown error"}`,
    );
    process.exitCode = 1;
  }
}

await main();
