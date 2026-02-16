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

const _DeliveryTypeJson = zodToJsonSchema(DeliveryTypeZ as any, "DeliveryType");
const DeliveryTypeJson =
  (_DeliveryTypeJson.definitions &&
    (_DeliveryTypeJson.definitions as any).DeliveryType) ||
  _DeliveryTypeJson;
const _WeightTierJson = zodToJsonSchema(WeightTierZ as any, "WeightTier");
const WeightTierJson =
  (_WeightTierJson.definitions &&
    (_WeightTierJson.definitions as any).WeightTier) ||
  _WeightTierJson;
const _VehicleCategoryJson = zodToJsonSchema(
  VehicleCategoryZ as any,
  "VehicleCategory",
);
const VehicleCategoryJson =
  (_VehicleCategoryJson.definitions &&
    (_VehicleCategoryJson.definitions as any).VehicleCategory) ||
  _VehicleCategoryJson;
const _PackageTypeJson = zodToJsonSchema(PackageTypeZ as any, "PackageType");
const PackageTypeJson =
  (_PackageTypeJson.definitions &&
    (_PackageTypeJson.definitions as any).PackageType) ||
  _PackageTypeJson;
const _PaymentMethodJson = zodToJsonSchema(
  StaticPaymentMethodZ as any,
  "PaymentMethod",
);
const PaymentMethodJson =
  (_PaymentMethodJson.definitions &&
    (_PaymentMethodJson.definitions as any).PaymentMethod) ||
  _PaymentMethodJson;
const _CreateOrderDataJson = zodToJsonSchema(
  CreateOrderDataZ as any,
  "CreateOrderData",
);
const CreateOrderDataJson =
  (_CreateOrderDataJson.definitions &&
    (_CreateOrderDataJson.definitions as any).CreateOrderData) ||
  _CreateOrderDataJson;
const _OrderStatusJson = zodToJsonSchema(OrderStatusZ as any, "OrderStatus");
const OrderStatusJson =
  (_OrderStatusJson.definitions &&
    (_OrderStatusJson.definitions as any).OrderStatus) ||
  _OrderStatusJson;

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
