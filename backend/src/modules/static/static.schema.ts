// services/backend/src/modules/static/static.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  DeliveryTypeZ,
  WeightTierZ,
  VehicleCategoryZ,
  PackageTypeZ,
  PaymentMethodZ,
  CreateOrderDataZ,
  OrderStatusZ,
} from "./static.zod.js";

const DeliveryTypeJson = zodToJsonSchema(DeliveryTypeZ as any, "DeliveryType");
const WeightTierJson = zodToJsonSchema(WeightTierZ as any, "WeightTier");
const VehicleCategoryJson = zodToJsonSchema(
  VehicleCategoryZ as any,
  "VehicleCategory",
);
const PackageTypeJson = zodToJsonSchema(PackageTypeZ as any, "PackageType");
const PaymentMethodJson = zodToJsonSchema(
  PaymentMethodZ as any,
  "PaymentMethod",
);
const CreateOrderDataJson = zodToJsonSchema(
  CreateOrderDataZ as any,
  "CreateOrderData",
);
const OrderStatusJson = zodToJsonSchema(OrderStatusZ as any, "OrderStatus");

export const getDeliveryTypesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: DeliveryTypeJson },
      },
    },
  },
};

export const getWeightTiersSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: WeightTierJson },
      },
    },
  },
};

export const getVehicleCategoriesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: VehicleCategoryJson },
      },
    },
  },
};

export const getPackageTypesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: PackageTypeJson },
      },
    },
  },
};

export const getPaymentMethodsSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: PaymentMethodJson },
      },
    },
  },
};

export const getCreateOrderDataSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: { success: { type: "boolean" }, data: CreateOrderDataJson },
    },
  },
};

export const getOrderStatusesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        data: { type: "array", items: OrderStatusJson },
      },
    },
  },
};
