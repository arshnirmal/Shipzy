// services/backend/src/modules/orders/orders.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  BulkCancelRequestZ,
  CalculateFareRequestZ,
  CreateOrderRequestZ,
  RateOrderRequestZ,
  CancelOrderRequestZ,
  UpdateOrderStatusRequestZ,
  OrderParamsZ,
  ListOrdersQueryZ,
  AvailableOrdersQueryZ,
} from "./orders.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const paramsJson = zodToJsonSchema(
  OrderParamsZ as unknown as ZodToJsonSchemaInput,
);

export const calculateFareSchema: FastifySchema = {
  body: zodToJsonSchema(
    CalculateFareRequestZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const createOrderSchema: FastifySchema = {
  body: zodToJsonSchema(CreateOrderRequestZ as unknown as ZodToJsonSchemaInput),
};
export const getOrderByIdSchema: FastifySchema = { params: paramsJson };
export const listOrdersSchema: FastifySchema = {
  querystring: zodToJsonSchema(
    ListOrdersQueryZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const getAvailableOrdersSchema: FastifySchema = {
  querystring: zodToJsonSchema(
    AvailableOrdersQueryZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const cancelOrderSchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(CancelOrderRequestZ as unknown as ZodToJsonSchemaInput),
};
export const acceptOrderSchema: FastifySchema = { params: paramsJson };
export const updateOrderStatusSchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(
    UpdateOrderStatusRequestZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const rateOrderSchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(RateOrderRequestZ as unknown as ZodToJsonSchemaInput),
};
export const bulkCancelSchema: FastifySchema = {
  body: zodToJsonSchema(BulkCancelRequestZ as unknown as ZodToJsonSchemaInput),
};
