// services/backend/src/modules/static/static.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  DeliveryTypeZ,
  WeightTierZ,
  VehicleCategoryZ,
  PackageTypeZ,
  StaticPaymentMethodZ,
  CreateOrderDataZ,
  OrderStatusZ,
} from "./static.zod.js";

const DeliveryTypeJson = zodToJsonSchema(DeliveryTypeZ as any);
const WeightTierJson = zodToJsonSchema(WeightTierZ as any);
const VehicleCategoryJson = zodToJsonSchema(VehicleCategoryZ as any);
const PackageTypeJson = zodToJsonSchema(PackageTypeZ as any);
const PaymentMethodJson = zodToJsonSchema(StaticPaymentMethodZ as any);
const CreateOrderDataJson = zodToJsonSchema(CreateOrderDataZ as any);
const OrderStatusJson = zodToJsonSchema(OrderStatusZ as any);

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
