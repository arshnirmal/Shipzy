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
      "paymentMethodId",
      "pickup",
      "delivery",
      "estimatedDistanceKm",
    ],
    properties: {
      deliveryTypeId: { type: "integer" },
      paymentMethodId: { type: "integer" },
      estimatedDistanceKm: { type: "number", minimum: 0.1 },
      packageDescription: { type: "string", maxLength: 500 },
      packageWeightKg: { type: "number", minimum: 0 },
      packageDimensions: { type: "object" },
      specialInstructions: { type: "string", maxLength: 1000 },
      scheduledPickupTime: { type: "string", format: "date-time" },
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
          address: { type: "string" },
          building: { type: "string" },
          floor: { type: "string" },
          flatNumber: { type: "string" },
          landmark: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
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
          address: { type: "string" },
          building: { type: "string" },
          floor: { type: "string" },
          flatNumber: { type: "string" },
          landmark: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          postalCode: { type: "string" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
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
