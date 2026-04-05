import type { FastifyInstance } from "fastify";
import { inject, authHeaders } from "./app.js";
import { getTokens } from "./auth.js";

const unique = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

let cachedOrderFulfillment: {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId: number;
  packageTypeId: number | null;
  paymentMethodId: number;
} | null = null;

const defaultAddress = (
  label: string,
  latitude: number,
  longitude: number,
) => ({
  fullAddress: `${label} Road, Bengaluru, Karnataka 560001`,
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560001",
  latitude,
  longitude,
  contactName: `${label} Contact`,
  contactPhone: "9999999999",
  landmark: `${label} landmark`,
});

export const createClient = async (
  app: FastifyInstance,
  overrides: Record<string, unknown> = {},
) => {
  const email = String(overrides.email || `${unique("client")}@shipzy.test`);
  const password = String(overrides.password || "TestPass123!");
  const fullName = String(overrides.fullName || "Test Client");

  const response = await inject(app, {
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      identity: {
        fullName,
        role: "client",
      },
      credentials: {
        email,
        password,
      },
    },
    headers: {
      "x-device-id": unique("client-device"),
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(
      `createClient failed: ${response.statusCode} ${response.body}`,
    );
  }

  const body = response.json();
  const tokens = getTokens(body);

  return {
    user: body.data.actor.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    credentials: { email, password },
  };
};

export const createCourier = async (
  app: FastifyInstance,
  overrides: Record<string, unknown> = {},
) => {
  const email = String(overrides.email || `${unique("courier")}@shipzy.test`);
  const password = String(overrides.password || "TestPass123!");
  const fullName = String(overrides.fullName || "Test Courier");

  const response = await inject(app, {
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      identity: {
        fullName,
        role: "courier",
      },
      credentials: {
        email,
        password,
      },
    },
    headers: {
      "x-device-id": unique("courier-device"),
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(
      `createCourier failed: ${response.statusCode} ${response.body}`,
    );
  }

  const body = response.json();
  const tokens = getTokens(body);

  const shouldActivate = overrides.activate !== false;
  if (shouldActivate) {
    const availabilityResponse = await inject(app, {
      method: "PATCH",
      url: "/api/v1/drivers/me/availability",
      headers: authHeaders(tokens.accessToken),
      payload: {
        availability: {
          isAvailable: true,
          isOnline: true,
        },
        tracking: {
          currentLocation: {
            latitude: 12.9716,
            longitude: 77.5946,
          },
        },
      },
    });

    if (availabilityResponse.statusCode !== 200) {
      throw new Error(
        `createCourier availability setup failed: ${availabilityResponse.statusCode} ${availabilityResponse.body}`,
      );
    }
  }

  return {
    user: body.data.actor.user,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    credentials: { email, password },
  };
};

const getOrderCatalog = async (app: FastifyInstance) => {
  const response = await inject(app, {
    method: "GET",
    url: "/api/v1/static/create-order-data",
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `create-order-data failed: ${response.statusCode} ${response.body}`,
    );
  }

  return response.json().data.createOrder;
};

export const createOrder = async (
  app: FastifyInstance,
  clientToken: string,
  overrides: Record<string, unknown> = {},
) => {
  const catalog = await getOrderCatalog(app);

  const pickup =
    (overrides.pickup as Record<string, unknown>) ||
    defaultAddress("Pickup", 12.9716, 77.5946);
  const delivery =
    (overrides.delivery as Record<string, unknown>) ||
    defaultAddress("Delivery", 12.9352, 77.6245);

  const paymentMethod = catalog.paymentMethods[0];
  const packageTypeIds = (catalog.packageTypes || [])
    .map((item: Record<string, unknown>) => Number(item.packageTypeId))
    .filter((id: number) => Number.isFinite(id) && id > 0);
  const orderedPackageTypeIds =
    packageTypeIds.length > 0 ? packageTypeIds : [null];

  const buildCombos = () => {
    const MAX_COMBOS = 24;
    const combos: Array<{
      deliveryTypeId: number;
      vehicleCategoryId: number;
      weightTierId: number;
      packageTypeId: number | null;
      paymentMethodId: number;
    }> = [];

    if (cachedOrderFulfillment) {
      combos.push(cachedOrderFulfillment);
    }

    outerLoop: for (const deliveryType of catalog.deliveryTypes || []) {
      for (const vehicle of deliveryType.supportedVehicles || []) {
        for (const tier of vehicle.weightTiers || []) {
          for (const packageTypeId of orderedPackageTypeIds) {
            const combo = {
              deliveryTypeId: Number(deliveryType.deliveryTypeId),
              vehicleCategoryId: Number(vehicle.categoryId),
              weightTierId: Number(tier.tierId),
              packageTypeId,
              paymentMethodId: Number(paymentMethod.methodId),
            };

            const alreadyIncluded = combos.some(
              (entry) =>
                entry.deliveryTypeId === combo.deliveryTypeId &&
                entry.vehicleCategoryId === combo.vehicleCategoryId &&
                entry.weightTierId === combo.weightTierId &&
                entry.packageTypeId === combo.packageTypeId,
            );

            if (!alreadyIncluded) {
              combos.push(combo);

              if (combos.length >= MAX_COMBOS) {
                break outerLoop;
              }
            }
          }
        }
      }
    }

    return combos;
  };

  const combos = buildCombos();
  let lastError = "Unable to create order with available fulfillment options";

  for (const combo of combos) {
    const fareResponse = await inject(app, {
      method: "POST",
      url: "/api/v1/orders/calculate-fare",
      headers: authHeaders(clientToken),
      payload: {
        fulfillment: {
          deliveryTypeId: combo.deliveryTypeId,
          vehicleCategoryId: combo.vehicleCategoryId,
          weightTierId: combo.weightTierId,
          packageTypeId: combo.packageTypeId,
        },
        locations: {
          pickup: {
            latitude: Number(pickup.latitude),
            longitude: Number(pickup.longitude),
          },
          delivery: {
            latitude: Number(delivery.latitude),
            longitude: Number(delivery.longitude),
          },
        },
      },
    });

    if (fareResponse.statusCode !== 200) {
      lastError = `calculate-fare failed: ${fareResponse.statusCode} ${fareResponse.body}`;
      if (cachedOrderFulfillment && combo === cachedOrderFulfillment) {
        cachedOrderFulfillment = null;
      }
      continue;
    }

    const pricing = fareResponse.json().data.pricing;

    const createResponse = await inject(app, {
      method: "POST",
      url: "/api/v1/orders",
      headers: authHeaders(clientToken),
      payload: {
        fulfillment: {
          deliveryTypeId: combo.deliveryTypeId,
          vehicleCategoryId: combo.vehicleCategoryId,
          weightTierId: combo.weightTierId,
          packageTypeId: combo.packageTypeId,
          paymentMethodId: combo.paymentMethodId,
        },
        locations: {
          pickup,
          delivery,
        },
        package: {
          description: "Test package",
          specialInstructions: "Handle with care",
          declaredValue: 500,
          notifyRecipientSms: false,
        },
        schedule: {},
        pricing,
        items: [
          {
            itemName: "Parcel",
            quantity: 1,
            weightKg: 0.8,
          },
        ],
      },
    });

    if (createResponse.statusCode === 201) {
      cachedOrderFulfillment = combo;
      return {
        order: createResponse.json().data.order,
      };
    }

    lastError = `createOrder failed: ${createResponse.statusCode} ${createResponse.body}`;
  }

  throw new Error(lastError);
};

export const createAssignment = async (
  app: FastifyInstance,
  orderId: number,
  courierToken: string,
) => {
  const response = await inject(app, {
    method: "POST",
    url: `/api/v1/orders/${orderId}/accept`,
    headers: authHeaders(courierToken),
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `createAssignment failed: ${response.statusCode} ${response.body}`,
    );
  }

  return {
    assignment: response.json().data.assignment,
  };
};

const statusSequence = ["picked_up", "in_transit", "delivered"] as const;

export const advanceOrderTo = async (
  app: FastifyInstance,
  orderId: number,
  courierToken: string,
  status: (typeof statusSequence)[number],
) => {
  for (const step of statusSequence) {
    const response = await inject(app, {
      method: "PATCH",
      url: `/api/v1/orders/${orderId}/status`,
      headers: authHeaders(courierToken),
      payload: {
        transition: {
          status: step,
        },
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(
        `advanceOrderTo(${step}) failed: ${response.statusCode} ${response.body}`,
      );
    }

    if (step === status) {
      return response.json().data.order;
    }
  }

  return null;
};

export const createRating = async (
  app: FastifyInstance,
  orderId: number,
  clientToken: string,
  score = 5,
) => {
  const response = await inject(app, {
    method: "POST",
    url: `/api/v1/ratings/orders/${orderId}`,
    headers: authHeaders(clientToken),
    payload: {
      feedback: {
        score,
        comment: "Excellent delivery",
      },
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(
      `createRating failed: ${response.statusCode} ${response.body}`,
    );
  }

  return {
    rating: response.json().data.rating,
  };
};
