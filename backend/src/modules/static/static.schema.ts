// services/backend/src/modules/static/static.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  DeliveryTypesResponseZ,
  WeightTiersResponseZ,
  VehicleCategoriesResponseZ,
  PackageTypesResponseZ,
  PaymentMethodsResponseZ,
  CreateOrderDataResponseZ,
  OrderStatusesResponseZ,
} from "./static.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const DeliveryTypesResponseJson = zodToJsonSchema(
  DeliveryTypesResponseZ as unknown as ZodToJsonSchemaInput,
);
const WeightTiersResponseJson = zodToJsonSchema(
  WeightTiersResponseZ as unknown as ZodToJsonSchemaInput,
);
const VehicleCategoriesResponseJson = zodToJsonSchema(
  VehicleCategoriesResponseZ as unknown as ZodToJsonSchemaInput,
);
const PackageTypesResponseJson = zodToJsonSchema(
  PackageTypesResponseZ as unknown as ZodToJsonSchemaInput,
);
const PaymentMethodsResponseJson = zodToJsonSchema(
  PaymentMethodsResponseZ as unknown as ZodToJsonSchemaInput,
);
const CreateOrderDataResponseJson = zodToJsonSchema(
  CreateOrderDataResponseZ as unknown as ZodToJsonSchemaInput,
);
const OrderStatusesResponseJson = zodToJsonSchema(
  OrderStatusesResponseZ as unknown as ZodToJsonSchemaInput,
);

const successEnvelope = (data: unknown) => ({
  type: "object",
  properties: {
    success: { type: "boolean" },
    message: { type: "string" },
    data,
    timestamp: { type: "string" },
  },
  required: ["success", "message", "data", "timestamp"],
});

export const getDeliveryTypesSchema: FastifySchema = {
  response: {
    200: successEnvelope(DeliveryTypesResponseJson),
  },
};

export const getWeightTiersSchema: FastifySchema = {
  response: {
    200: successEnvelope(WeightTiersResponseJson),
  },
};

export const getVehicleCategoriesSchema: FastifySchema = {
  response: {
    200: successEnvelope(VehicleCategoriesResponseJson),
  },
};

export const getPackageTypesSchema: FastifySchema = {
  response: {
    200: successEnvelope(PackageTypesResponseJson),
  },
};

export const getPaymentMethodsSchema: FastifySchema = {
  response: {
    200: successEnvelope(PaymentMethodsResponseJson),
  },
};

export const getCreateOrderDataSchema: FastifySchema = {
  response: {
    200: successEnvelope(CreateOrderDataResponseJson),
  },
};

export const getOrderStatusesSchema: FastifySchema = {
  response: {
    200: successEnvelope(OrderStatusesResponseJson),
  },
};
