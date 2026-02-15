import axios, { AxiosInstance } from "axios";
import { faker } from "@faker-js/faker";
import pool from "../src/database/db";

// Configuration
const API_URL =
  process.env.API_URL ||
  "https://unsegmented-steamerless-criselda.ngrok-free.dev/api/v1";

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

// Fetch existing users from DB and login to get tokens
async function fetchExistingUsers() {
  console.log("📊 Fetching existing users from DB...");
  try {
    const query =
      "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role_id = $1 AND deleted_at IS NULL";
    const res = await pool.query(query, [1]); // 1 for client
    for (const row of res.rows) {
      const loginData = { email: row.email, password: "Password123!" };
      const loginRes = await api.post("/auth/login", loginData);
      if (loginRes.data.success) {
        const tokens = loginRes.data.data.tokens;
        // Fetch address
        const addrRes = await api.get("/users/me/addresses", {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        let addressId = null;
        if (addrRes.data.success && addrRes.data.data.length > 0) {
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
      } else {
        console.error(`❌ Failed to login user ${row.email}`);
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
      "SELECT user_id, full_name, email, phone_number FROM users.profiles WHERE role_id = $1 AND deleted_at IS NULL";
    const res = await pool.query(query, [2]); // 2 for courier
    for (const row of res.rows) {
      const loginData = { email: row.email, password: "Password123!" };
      const loginRes = await api.post("/auth/login", loginData);
      if (loginRes.data.success) {
        const tokens = loginRes.data.data.tokens;
        state.drivers.push({
          userId: row.user_id,
          fullName: row.full_name,
          email: row.email,
          phoneNumber: row.phone_number,
          accessToken: tokens.accessToken,
        });
      } else {
        console.error(`❌ Failed to login driver ${row.email}`);
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
  if (res.data.success) {
    state.staticData = res.data.data;

    // Fallback if some are still null (though we just seeded them)
    if (!state.staticData.deliveryTypes) {
      const dtRes = await api.get("/static/delivery-types");
      state.staticData.deliveryTypes = dtRes.data.data;
    }
    if (!state.staticData.packageTypes) {
      const ptRes = await api.get("/static/package-types");
      state.staticData.packageTypes = ptRes.data.data;
    }

    // Also need weight tiers and vehicle categories
    const wtRes = await api.get("/static/weight-tiers");
    state.staticData.weightTiers = wtRes.data.data;

    const vcRes = await api.get("/static/vehicle-categories");
    state.staticData.vehicleCategories = vcRes.data.data;

    console.log(
      `   Fetched: ${state.staticData.deliveryTypes?.length} delivery types, ${state.staticData.packageTypes?.length} package types`,
    );
  } else {
    console.error("❌ Failed to fetch static data");
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

      if (regRes.data.success) {
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

        if (addrRes.data.success) {
          console.log(`   📍 Address added: ${addressData.fullAddress}`);
          state.users[state.users.length - 1].addressId =
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
  const vehicleTypes = ["bike", "scooter", "van"];

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

      if (regRes.data.success) {
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
          vehicleType:
            vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
          vehicleNumber:
            "MH" +
            faker.number.int({ min: 10, max: 99 }) +
            faker.string.alpha({ length: 2, casing: "upper" }) +
            faker.number.int({ min: 1000, max: 9999 }),
        };
        await api.put("/drivers/me", updateData, tokenHeader);
        const location = generateMumbaiCoordinates();
        await api.put("/drivers/me/location", location, tokenHeader);
        await api.put(
          "/drivers/me/availability",
          { isAvailable: true, isOnline: true },
          tokenHeader,
        );
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
    const vc =
      dt.supportedVehicles[
        Math.floor(Math.random() * dt.supportedVehicles.length)
      ];

    // Choose a weight tier compatible with the selected vehicle's max weight
    const compatibleWeightTiers = state.staticData.weightTiers.filter(
      (t) =>
        typeof t.maxWeightKg === "number" &&
        t.maxWeightKg <= (vc.maxWeightKg ?? Infinity),
    );

    const wt = compatibleWeightTiers.length
      ? compatibleWeightTiers[
          Math.floor(Math.random() * compatibleWeightTiers.length)
        ]
      : state.staticData.weightTiers[
          Math.floor(Math.random() * state.staticData.weightTiers.length)
        ];
    const pm = state.staticData.paymentMethods[0]; // Cash

    const farePayload = {
      deliveryTypeId: dt.deliveryTypeId,
      vehicleCategoryId: vc.categoryId,
      weightTierId: wt.tierId,
      pickup: { lat: pickup.latitude, lng: pickup.longitude },
      drop: { lat: delivery.latitude, lng: delivery.longitude },
    };

    try {
      console.log(`Calculating fare for user ${user.fullName}...`);
      const fareRes = await api.post(
        "/orders/calculate-fare",
        farePayload,
        tokenHeader,
      );

      if (!fareRes.data.success) {
        console.error(`❌ Fare calculation failed: ${fareRes.data.message}`);
        continue;
      }

      const fareBreakdown = fareRes.data.data;

      const orderData = {
        deliveryTypeId: dt.deliveryTypeId,
        vehicleCategoryId: vc.categoryId,
        weightTierId: wt.tierId,
        packageTypeId: pt.packageTypeId,
        paymentMethodId: pm.methodId,

        pickup: {
          address:
            faker.location.streetAddress({ useFullAddress: true }) + ", Mumbai",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          contactName: user.fullName,
          contactPhone: user.phoneNumber,
          addressId: user.addressId,
        },

        delivery: {
          address:
            faker.location.streetAddress({ useFullAddress: true }) + ", Mumbai",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400058",
          latitude: delivery.latitude,
          longitude: delivery.longitude,
          contactName: faker.person.fullName(),
          contactPhone: "+91" + faker.string.numeric(10),
        },

        fareBreakdown,
        packageDescription: faker.commerce.productDescription(),
        specialInstructions: Math.random() > 0.5 ? "Ring doorbell" : "",
        declaredValue: faker.number.int({ min: 100, max: 5000 }),
      };

      console.log(`Creating order for user ${user.fullName} (${dt.name})...`);
      const orderRes = await api.post("/orders", orderData, tokenHeader);

      if (orderRes.data.success) {
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
      } else {
        console.error(`❌ Failed to create order: ${orderRes.data.message}`);
        if (orderRes.data.errors)
          console.error(JSON.stringify(orderRes.data.errors, null, 2));
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

    if (acceptRes.data.success) {
      console.log(`   🚚 Driver ${driver.fullName} accepted order ${orderId}`);

      // 2. Simulate Pick up
      await delay(2000);
      const pickupRes = await api.put(
        `/orders/${orderId}/status`,
        { status: "picked_up" },
        tokenHeader,
      );
      if (pickupRes.data.success)
        console.log(`   📦 Order ${orderId} picked up`);

      // 3. Simulate Delivery
      if (Math.random() > 0.5) {
        await delay(2000);
        const deliverRes = await api.put(
          `/orders/${orderId}/status`,
          { status: "delivered" },
          tokenHeader,
        );
        if (deliverRes.data.success)
          console.log(`   ✅ Order ${orderId} delivered`);
      }
    } else {
      console.log(`   ⚠️ Driver accept failed: ${acceptRes.data.message}`);
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
  }
}

await main();
