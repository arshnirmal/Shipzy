// services/backend/src/modules/orders/orders.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CalculateFareRequestZ,
  CreateOrderRequestZ,
  RateOrderRequestZ,
  CancelOrderRequestZ,
  UpdateOrderStatusRequestZ,
  OrderParamsZ,
  ListOrdersQueryZ,
  AvailableOrdersQueryZ,
  ArriveRequestZ,
  UndeliverableRequestZ,
  ProofOfDeliveryRequestZ,
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

// ── Driver order action schemas ─────────────────────────────────────────────

export const arriveSchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(ArriveRequestZ as unknown as ZodToJsonSchemaInput),
};
export const undeliverableSchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(
    UndeliverableRequestZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const returnSchema: FastifySchema = { params: paramsJson };
export const returnedSchema: FastifySchema = { params: paramsJson };
export const proofOfDeliverySchema: FastifySchema = {
  params: paramsJson,
  body: zodToJsonSchema(
    ProofOfDeliveryRequestZ as unknown as ZodToJsonSchemaInput,
  ),
};
export const trackingSchema: FastifySchema = { params: paramsJson };

