import axios, { AxiosInstance } from "axios";
import { faker } from "@faker-js/faker";
import { drizzlePool } from "../src/database/drizzle.js";

// Configuration
const API_URL =
  process.env.API_URL ||
  `http://${process.env.BACKEND_HOST || "localhost"}:${process.env.BACKEND_PORT || "3000"}/api/v1`;

console.log(`Using API URL: ${API_URL}`);

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
});

// State to store created data
const state = {
  users: [] as any[],
  drivers: [] as any[],
  orders: [] as any[],
  staticData: {
    deliveryTypes: [] as any[],
    packageTypes: [] as any[],
    vehicleCategories: [] as any[],
    paymentMethods: [] as any[],
    weightTiers: [] as any[],
  },
};

type ActionStats = { success: number; failure: number };
const actionStats = new Map<string, ActionStats>();

// Helper to generate coordinates in Mumbai
const generateMumbaiCoordinates = () => {
  const minLat = 18.89;
  const maxLat = 19.27;
  const minLng = 72.77;
  const maxLng = 72.98;
  return {
    latitude: Math.random() * (maxLat - minLat) + minLat,
    longitude: Math.random() * (maxLng - minLng) + minLng,
  };
};

// Helper for delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatApiErrors(errors: any): string {
  if (!errors) return "";
  if (Array.isArray(errors)) {
    return errors
      .map((err) => {
        if (typeof err === "string") return err;
        if (err?.message) return String(err.message);
        return JSON.stringify(err);
      })
      .join(" | ");
  }
  if (typeof errors === "string") return errors;
  return JSON.stringify(errors);
}

function isApiSuccess(res: any): boolean {
  return (
    res &&
    res.status >= 200 &&
    res.status < 300 &&
    res.data &&
    res.data.success === true
  );
}

function logApiFailure(action: string, res: any) {
  const status = res?.status ?? "unknown";
  const message =
    res?.data?.message ||
    res?.data?.error ||
    "Request failed without a backend message";
  const errors = formatApiErrors(res?.data?.errors);
  console.error(`❌ ${action} failed [HTTP ${status}]: ${message}`);
  if (errors) {
    console.error(`   ↳ Validation: ${errors}`);
  }
}

function ensureApiSuccess(action: string, res: any): boolean {
  const current = actionStats.get(action) || { success: 0, failure: 0 };
  if (isApiSuccess(res)) {
    current.success += 1;
    actionStats.set(action, current);
    return true;
  }
  current.failure += 1;
  actionStats.set(action, current);
  logApiFailure(action, res);
  return false;
}

function printSeedSummary() {
  console.log("\n📈 Seed API Summary");
  if (actionStats.size === 0) {
    console.log("   No tracked API actions executed.");
    return;
  }

  const rows = Array.from(actionStats.entries()).map(([action, stats]) => ({
    action,
    success: stats.success,
    failure: stats.failure,
    total: stats.success + stats.failure,
  }));

  rows.sort((a, b) => b.failure - a.failure || a.action.localeCompare(b.action));

  for (const row of rows) {
    const icon = row.failure > 0 ? "⚠️" : "✅";
    console.log(
      `   ${icon} ${row.action}: ${row.success}/${row.total} succeeded, ${row.failure} failed`,
    );
  }
}

// Fetch existing users from DB and login to get tokens
async function fetchExistingUsers() {
  console.log("📊 Fetching existing users from DB...");
  try {
    const query =
      "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role = $1 AND deleted_at IS NULL AND email IS NOT NULL";
    const res = await drizzlePool.query(query, ["client"]);
    for (const row of res.rows) {
      const loginData = { email: row.email, password: "Password123!" };
      const loginRes = await api.post("/auth/login", loginData);
      if (ensureApiSuccess(`Login existing user ${row.email}`, loginRes)) {
        const tokens = loginRes.data.data.tokens;
        // Fetch address
        const addrRes = await api.get("/users/me/addresses", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        let addressId = null;
        if (
          ensureApiSuccess(`Fetch addresses for ${row.email}`, addrRes) &&
          addrRes.data.data.length > 0
        ) {
          addressId = addrRes.data.data[0].addressId;
        }
        state.users.push({
          userId: row.user_id,
          fullName: row.full_name,
          email: row.email,
          phoneNumber: row.phone_number,
          accessToken: tokens.accessToken,
          addressId,
        });
      }
      await delay(200); // Small delay to avoid rate limiting
    }
    console.log(`   Fetched: ${state.users.length} users`);
  } catch (error: any) {
    console.error(`❌ Error fetching users: ${error.message}`);
  }
}

// Fetch existing drivers from DB and login to get tokens
async function fetchExistingDrivers() {
  console.log("📊 Fetching existing drivers from DB...");
  try {
    const query =
      "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role = $1 AND deleted_at IS NULL AND email IS NOT NULL";
    const res = await drizzlePool.query(query, ["courier"]);
    for (const row of res.rows) {
      const loginData = { email: row.email, password: "Password123!" };
      const loginRes = await api.post("/auth/login", loginData);
      if (ensureApiSuccess(`Login existing driver ${row.email}`, loginRes)) {
        const tokens = loginRes.data.data.tokens;
        state.drivers.push({
          userId: row.user_id,
          fullName: row.full_name,
          email: row.email,
          phoneNumber: row.phone_number,
          accessToken: tokens.accessToken,
        });
      }
      await delay(200);
    }
    console.log(`   Fetched: ${state.drivers.length} drivers`);
  } catch (error: any) {
    console.error(`❌ Error fetching drivers: ${error.message}`);
  }
}

async function fetchStaticData() {
  console.log("📊 Fetching static data for IDs...");
  const res = await api.get("/static/create-order-data");
  if (ensureApiSuccess("Fetch create-order static data", res)) {
    state.staticData = res.data.data;

    // Fallback if some are still null (though we just seeded them)
    if (!state.staticData.deliveryTypes) {
      const dtRes = await api.get("/static/delivery-types");
      if (ensureApiSuccess("Fallback fetch delivery types", dtRes)) {
        state.staticData.deliveryTypes = dtRes.data.data;
      }
    }
    if (!state.staticData.packageTypes) {
      const ptRes = await api.get("/static/package-types");
      if (ensureApiSuccess("Fallback fetch package types", ptRes)) {
        state.staticData.packageTypes = ptRes.data.data;
      }
    }

    // Also need weight tiers and vehicle categories
    const wtRes = await api.get("/static/weight-tiers");
    if (ensureApiSuccess("Fetch weight tiers", wtRes)) {
      state.staticData.weightTiers = wtRes.data.data;
    }

    const vcRes = await api.get("/static/vehicle-categories");
    if (ensureApiSuccess("Fetch vehicle categories", vcRes)) {
      state.staticData.vehicleCategories = vcRes.data.data;
    }

    console.log(
      `   Fetched: ${state.staticData.deliveryTypes?.length} delivery types, ${state.staticData.packageTypes?.length} package types`,
    );
  }
}

async function seedUsers(count = 3) {
  console.log(`\n🌱 Seeding ${count} users...`);

  for (let i = 0; i < count; i++) {
    const userData = {
      fullName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: "Password123!",
      phoneNumber: "+91" + faker.string.numeric(10),
      role: "client",
    };

    try {
      console.log(`Registering user: ${userData.email}`);
      const regRes = await api.post("/auth/register", userData);

      if (ensureApiSuccess(`Register user ${userData.email}`, regRes)) {
        const user = regRes.data.data.user;
        const tokens = regRes.data.data.tokens;

        state.users.push({
          ...user,
          accessToken: tokens.accessToken,
        });
        console.log(`✅ User created: ${user.fullName} (ID: ${user.userId})`);

        const addressData = {
          addressType: "home",
          label: "Home",
          fullAddress: faker.location.streetAddress({ useFullAddress: true }),
          building: faker.location.buildingNumber(),
          floor: faker.number.int({ min: 1, max: 20 }).toString(),
          flatNumber: faker.number.int({ min: 101, max: 2004 }).toString(),
          landmark: "Near " + faker.location.street(),
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          isDefault: true,
          ...generateMumbaiCoordinates(),
        };

        const addrRes = await api.post("/users/me/addresses", addressData, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        if (ensureApiSuccess(`Create address for ${userData.email}`, addrRes)) {
          console.log(`   📍 Address added: ${addressData.fullAddress}`);
          state.users.at(-1).addressId =
            addrRes.data.data.addressId;
        }
      }
    } catch (error: any) {
      console.error(`❌ Error creating user: ${error.message}`);
    }
    await delay(500);
  }
}

async function seedDrivers(count = 2) {
  console.log(`\n🚚 Seeding ${count} drivers...`);

  for (let i = 0; i < count; i++) {
    const driverData = {
      fullName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      password: "Password123!",
      phoneNumber: "+91" + faker.string.numeric(10),
      role: "courier",
    };

    try {
      console.log(`Registering driver: ${driverData.email}`);
      const regRes = await api.post("/auth/register", driverData);

      if (ensureApiSuccess(`Register driver ${driverData.email}`, regRes)) {
        const driver = regRes.data.data.user;
        const tokens = regRes.data.data.tokens;
        state.drivers.push({ ...driver, accessToken: tokens.accessToken });
        console.log(
          `✅ Driver created: ${driver.fullName} (ID: ${driver.userId})`,
        );

        const tokenHeader = {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        };
        const updateData = {
          profilePictureUrl: faker.image.avatar(),
        };
        const profileRes = await api.put("/drivers/me", updateData, tokenHeader);
        if (!ensureApiSuccess(`Update driver profile ${driverData.email}`, profileRes)) {
          continue;
        }
        const location = generateMumbaiCoordinates();
        const locationRes = await api.put("/drivers/me/location", location, tokenHeader);
        if (!ensureApiSuccess(`Update driver location ${driverData.email}`, locationRes)) {
          continue;
        }
        const availabilityRes = await api.put(
          "/drivers/me/availability",
          { isAvailable: true, isOnline: true },
          tokenHeader,
        );
        if (
          !ensureApiSuccess(
            `Update driver availability ${driverData.email}`,
            availabilityRes,
          )
        ) {
          continue;
        }
        console.log(`   🟢 Driver is now Online & Available`);
      }
    } catch (error: any) {
      console.error(`❌ Error creating driver: ${error.message}`);
    }
    await delay(500);
  }
}

async function seedOrders(count = 3) {
  console.log(`\n📦 Seeding ${count} orders...`);

  // Fetch existing users if none in state
  if (state.users.length === 0) {
    await fetchExistingUsers();
  }

  if (state.users.length === 0 || !state.staticData.deliveryTypes?.length) {
    console.log("⚠️ No users or static data available. Skipping.");
    return;
  }

  for (let i = 0; i < count; i++) {
    const user = state.users[Math.floor(Math.random() * state.users.length)];
    const tokenHeader = {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    };

    const pickup = generateMumbaiCoordinates();
    const delivery = generateMumbaiCoordinates();

    const dt =
      state.staticData.deliveryTypes[
        Math.floor(Math.random() * state.staticData.deliveryTypes.length)
      ];
    const pt =
      state.staticData.packageTypes[
        Math.floor(Math.random() * state.staticData.packageTypes.length)
      ];

    // Choose a supported vehicle for the selected delivery type
    if (!dt.supportedVehicles || dt.supportedVehicles.length === 0) {
      console.warn(
        "No supported vehicles for delivery type, skipping this order",
      );
      await delay(100);
      continue;
    }

    const vc =
      dt.supportedVehicles[
        Math.floor(Math.random() * dt.supportedVehicles.length)
      ];

    // Prefer vehicle-specific weight tiers (from supportedVehicles) — fall back to global weight tiers filtered by maxWeight
    let wt: any;
    if (vc.weightTiers && vc.weightTiers.length > 0) {
      const wtFromVc =
        vc.weightTiers[Math.floor(Math.random() * vc.weightTiers.length)];
      wt = {
        tierId: wtFromVc.tierId,
        name: wtFromVc.name,
        minWeightKg: wtFromVc.minWeightKg,
        maxWeightKg: wtFromVc.maxWeightKg,
      };
    } else {
      const compatibleWeightTiers = state.staticData.weightTiers.filter(
        (t) =>
          typeof t.maxWeightKg === "number" &&
          t.maxWeightKg <= (vc.maxWeightKg ?? Infinity),
      );
      wt = compatibleWeightTiers.length
        ? compatibleWeightTiers[
            Math.floor(Math.random() * compatibleWeightTiers.length)
          ]
        : state.staticData.weightTiers[
            Math.floor(Math.random() * state.staticData.weightTiers.length)
          ];
    }

    const pm = state.staticData.paymentMethods[0]; // Cash

    const farePayload = {
      deliveryTypeId: dt.deliveryTypeId,
      vehicleCategoryId: vc.categoryId,
      weightTierId: wt.tierId,
      pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
      drop: { latitude: delivery.latitude, longitude: delivery.longitude },
    };

    try {
      console.log(`Calculating fare for user ${user.fullName}...`);
      const fareRes = await api.post(
        "/orders/calculate-fare",
        farePayload,
        tokenHeader,
      );

      if (!ensureApiSuccess(`Calculate fare for ${user.fullName}`, fareRes)) {
        continue;
      }

      const fareBreakdown = fareRes.data.data;

      // Prepare full addresses (include both `fullAddress` and `address` for compatibility)
      const pickupFullAddress =
        faker.location.streetAddress({ useFullAddress: true }) + ", Mumbai";
      const deliveryFullAddress =
        faker.location.streetAddress({ useFullAddress: true }) + ", Mumbai";

      const orderData = {
        deliveryTypeId: dt.deliveryTypeId,
        vehicleCategoryId: vc.categoryId,
        weightTierId: wt.tierId,
        packageTypeId: pt.packageTypeId,
        paymentMethodId: pm.methodId,

        pickup: {
          fullAddress: pickupFullAddress,
          address: pickupFullAddress,
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          contactName: user.fullName || "Unknown",
          contactPhone: user.phoneNumber || "+91" + faker.string.numeric(10),
          addressId: user.addressId || null,
        },

        delivery: {
          fullAddress: deliveryFullAddress,
          address: deliveryFullAddress,
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400058",
          latitude: delivery.latitude,
          longitude: delivery.longitude,
          contactName: faker.person.fullName(),
          contactPhone: "+91" + faker.string.numeric(10),
          addressId: null,
        },

        fareBreakdown,
        packageDescription: faker.commerce.productDescription(),
        specialInstructions: Math.random() > 0.5 ? "Ring doorbell" : "",
        declaredValue: faker.number.int({ min: 100, max: 5000 }),
      };

      console.log(`Creating order for user ${user.fullName} (${dt.name})...`);
      const orderRes = await api.post("/orders", orderData, tokenHeader);

      if (ensureApiSuccess(`Create order for ${user.fullName}`, orderRes)) {
        const order = orderRes.data.data;
        state.orders.push(order);
        console.log(
          `✅ Order created: ${order.orderNumber} (ID: ${order.orderId})`,
        );

        // Fetch existing drivers if needed for simulation
        if (state.drivers.length === 0) {
          await fetchExistingDrivers();
        }

        if (state.drivers.length > 0 && Math.random() > 0.3) {
          const driver =
            state.drivers[Math.floor(Math.random() * state.drivers.length)];
          await simulateDriverFlow(driver, order.orderId);
        }
      }
    } catch (error: any) {
      console.error(`❌ Error creating order: ${error.message}`);
    }

    await delay(1000);
  }
}

async function simulateDriverFlow(driver: any, orderId: number) {
  const tokenHeader = {
    headers: { Authorization: `Bearer ${driver.accessToken}` },
  };

  try {
    console.log(`   Attempting driver ${driver.fullName} accept...`);

    // 1. Accept Order - Confirmed endpoint
    const acceptRes = await api.post(
      `/orders/${orderId}/accept`,
      {},
      tokenHeader,
    );

    if (ensureApiSuccess(`Driver accept order ${orderId}`, acceptRes)) {
      console.log(`   🚚 Driver ${driver.fullName} accepted order ${orderId}`);

      // 2. Simulate Pick up
      await delay(2000);
      const pickupRes = await api.put(
        `/orders/${orderId}/status`,
        { status: "picked_up" },
        tokenHeader,
      );
      if (ensureApiSuccess(`Mark picked_up for order ${orderId}`, pickupRes))
        console.log(`   📦 Order ${orderId} picked up`);

      // 3. Simulate in_transit (required before delivered)
      await delay(1500);
      const transitRes = await api.put(
        `/orders/${orderId}/status`,
        { status: "in_transit" },
        tokenHeader,
      );
      if (ensureApiSuccess(`Mark in_transit for order ${orderId}`, transitRes))
        console.log(`   🛣️ Order ${orderId} in transit`);

      // 4. Simulate Delivery
      if (Math.random() > 0.5) {
        await delay(2000);
        const deliverRes = await api.put(
          `/orders/${orderId}/status`,
          { status: "delivered" },
          tokenHeader,
        );
        if (ensureApiSuccess(`Mark delivered for order ${orderId}`, deliverRes))
          console.log(`   ✅ Order ${orderId} delivered`);
      }
    }
  } catch (e: any) {
    console.log(`   ⚠️ Driver flow error: ${e.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Default counts
  let userCount = 3;
  let driverCount = 2;
  let orderCount = 5;

  // Parse flags and counts
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--users" && i + 1 < args.length) {
      const count = Number.parseInt(args[i + 1]);
      if (!Number.isNaN(count) && count > 0) {
        userCount = count;
      }
      i++; // skip the number
    } else if (args[i] === "--drivers" && i + 1 < args.length) {
      const count = Number.parseInt(args[i + 1]);
      if (!Number.isNaN(count) && count > 0) {
        driverCount = count;
      }
      i++;
    } else if (args[i] === "--orders" && i + 1 < args.length) {
      const count = Number.parseInt(args[i + 1]);
      if (!Number.isNaN(count) && count > 0) {
        orderCount = count;
      }
      i++;
    }
  }

  const runUsers = args.includes("--users") || args.includes("--full");
  const runDrivers = args.includes("--drivers") || args.includes("--full");
  const runOrders = args.includes("--orders") || args.includes("--full");

  if (args.length === 0) {
    console.log(
      "No flags provided. Use --users <count>, --drivers <count>, --orders <count>, or --full to seed specific data.",
    );
    return;
  }

  try {
    await fetchStaticData();
    if (runUsers) await seedUsers(userCount);
    if (runDrivers) await seedDrivers(driverCount);
    // Give drivers a moment to register/online before orders come in
    await delay(1000);
    if (runOrders) await seedOrders(orderCount);

    console.log("\n✨ Seeding complete!");
  } catch (error) {
    console.error("Fatal error during seeding:", error);
  } finally {
    printSeedSummary();
    await drizzlePool.end();
  }
}

await main();
