// services/backend/src/modules/orders/orders.schema.ts
import { FastifySchema } from "fastify";

export const calculateFareSchema: FastifySchema = {
  body: {
    type: "object",
    required: [
      "deliveryTypeId",
      "vehicleCategoryId",
      "weightTierId",
      "pickup",
      "drop",
    ],
    properties: {
      deliveryTypeId: { type: "integer", minimum: 1 },
      vehicleCategoryId: { type: "integer", minimum: 1 },
      weightTierId: { type: "integer", minimum: 1 },
      pickup: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
        },
      },
      drop: {
        type: "object",
        required: ["lat", "lng"],
        properties: {
          lat: { type: "number", minimum: -90, maximum: 90 },
          lng: { type: "number", minimum: -180, maximum: 180 },
        },
      },
    },
  },
};

export const createOrderSchema: FastifySchema = {
  body: {
    type: "object",
    required: [
      "deliveryTypeId",
      "vehicleCategoryId",
      "weightTierId",
      "paymentMethodId",
      "pickup",
      "delivery",
      "fareBreakdown",
    ],
    properties: {
      deliveryTypeId: { type: "integer", minimum: 1 },
      vehicleCategoryId: { type: "integer", minimum: 1 },
      weightTierId: { type: "integer", minimum: 1 },
      packageTypeId: { type: "integer", minimum: 1 },
      paymentMethodId: { type: "integer", minimum: 1 },
      packageDescription: { type: "string", maxLength: 500 },
      specialInstructions: { type: "string", maxLength: 1000 },
      scheduledPickupTime: { type: "string", format: "date-time" },
      scheduledDeliveryTime: { type: "string", format: "date-time" },
      declaredValue: { type: "number", minimum: 0 },
      fareBreakdown: {
        type: "object",
        required: [
          "basePrice",
          "distanceKm",
          "distancePrice",
          "weightSurcharge",
          "totalPrice",
          "currency",
        ],
        properties: {
          basePrice: { type: "number", minimum: 0 },
          distanceKm: { type: "number", minimum: 0.5 },
          distancePrice: { type: "number", minimum: 0 },
          weightSurcharge: { type: "number", minimum: 0 },
          totalPrice: { type: "number", minimum: 0 },
          currency: { type: "string", enum: ["INR"] },
        },
      },
      pickup: {
        type: "object",
        required: [
          "address",
          "latitude",
          "longitude",
          "city",
          "state",
          "postalCode",
          "contactName",
          "contactPhone",
        ],
        properties: {
          addressId: { type: "integer", minimum: 1 },
          address: { type: "string" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          howToReach: { type: "string", maxLength: 500 },
          building: { type: "string", maxLength: 200 },
          floor: { type: "string", maxLength: 50 },
          flatNumber: { type: "string", maxLength: 50 },
          contactName: { type: "string" },
          contactPhone: { type: "string" },
        },
      },
      delivery: {
        type: "object",
        required: [
          "address",
          "latitude",
          "longitude",
          "city",
          "state",
          "postalCode",
          "contactName",
          "contactPhone",
        ],
        properties: {
          addressId: { type: "integer", minimum: 1 },
          address: { type: "string" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          howToReach: { type: "string", maxLength: 500 },
          building: { type: "string", maxLength: 200 },
          floor: { type: "string", maxLength: 50 },
          flatNumber: { type: "string", maxLength: 50 },
          contactName: { type: "string" },
          contactPhone: { type: "string" },
        },
      },
    },
  },
};

export const getOrderByIdSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
};

export const listOrdersSchema: FastifySchema = {
  querystring: {
    type: "object",
    properties: {
      page: { type: "integer", minimum: 1, default: 1 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      status: { type: "string", enum: ["active", "completed", "cancelled"] },
    },
  },
};

export const getAvailableOrdersSchema: FastifySchema = {
  querystring: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      radius: { type: "number", minimum: 1, maximum: 50, default: 10 },
      limit: { type: "integer", minimum: 1, maximum: 100, default: 20 },
    },
  },
};

export const cancelOrderSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
  body: {
    type: "object",
    required: ["cancellationReason"],
    properties: {
      cancellationReason: { type: "string", minLength: 5, maxLength: 500 },
    },
  },
};

export const acceptOrderSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
};

export const updateOrderStatusSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
  body: {
    type: "object",
    required: ["status"],
    properties: {
      status: { type: "string", enum: ["picked_up", "delivered"] },
    },
  },
};
