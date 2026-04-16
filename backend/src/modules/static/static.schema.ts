// services/backend/src/modules/static/static.schema.ts
import { FastifySchema } from "fastify";
import {
  DeliveryTypesResponseZ,
  WeightTiersResponseZ,
  VehicleCategoriesResponseZ,
  PackageTypesResponseZ,
  PaymentMethodsResponseZ,
  CreateOrderDataResponseZ,
  OrderStatusesResponseZ,
} from "./static.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const DeliveryTypesResponseJson = toJsonSchema(DeliveryTypesResponseZ);
const WeightTiersResponseJson = toJsonSchema(WeightTiersResponseZ);
const VehicleCategoriesResponseJson = toJsonSchema(VehicleCategoriesResponseZ);
const PackageTypesResponseJson = toJsonSchema(PackageTypesResponseZ);
const PaymentMethodsResponseJson = toJsonSchema(PaymentMethodsResponseZ);
const CreateOrderDataResponseJson = toJsonSchema(CreateOrderDataResponseZ);
const OrderStatusesResponseJson = toJsonSchema(OrderStatusesResponseZ);

export const getDeliveryTypesSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DeliveryTypesResponseJson),
  },
};

export const getWeightTiersSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(WeightTiersResponseJson),
  },
};

export const getVehicleCategoriesSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(VehicleCategoriesResponseJson),
  },
};

export const getPackageTypesSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(PackageTypesResponseJson),
  },
};

export const getPaymentMethodsSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(PaymentMethodsResponseJson),
  },
};

export const getCreateOrderDataSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(CreateOrderDataResponseJson),
  },
};

export const getOrderStatusesSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(OrderStatusesResponseJson),
  },
};
