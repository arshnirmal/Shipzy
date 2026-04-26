// services/backend/src/modules/orders/orders.schema.ts
import { FastifySchema } from "fastify";
import { z } from "zod";
import {
  AcceptOrderResultZ,
  AvailableOrderItemZ,
  ArrivePayloadZ,
  CalculateFareResponseZ,
  CancelOrderResultZ,
  CalculateFareRequestZ,
  CreateOrderResponseZ,
  CreateOrderRequestZ,
  OrderDetailsZ,
  OrderListItemZ,
  ProofOfDeliveryPayloadZ,
  RateOrderRequestZ,
  ReturnPayloadZ,
  ReturnedPayloadZ,
  TrackingPayloadZ,
  UndeliverablePayloadZ,
  UpdateOrderStatusResponseZ,
  CancelOrderRequestZ,
  UpdateOrderStatusRequestZ,
  OrderParamsZ,
  ListOrdersQueryZ,
  AvailableOrdersQueryZ,
  ArriveRequestZ,
  UndeliverableRequestZ,
  ProofOfDeliveryRequestZ,
} from "./orders.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  paginatedEnvelope,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const paramsJson = toJsonSchema(OrderParamsZ);

export const calculateFareSchema: FastifySchema = {
  body: toJsonSchema(CalculateFareRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(CalculateFareResponseZ)),
  },
};
export const createOrderSchema: FastifySchema = {
  body: toJsonSchema(CreateOrderRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(CreateOrderResponseZ)),
  },
};
export const getOrderByIdSchema: FastifySchema = {
  params: paramsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(OrderDetailsZ)),
  },
};
export const listOrdersSchema: FastifySchema = {
  querystring: toJsonSchema(ListOrdersQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: paginatedEnvelope(toJsonSchema(OrderListItemZ)),
  },
};
export const getAvailableOrdersSchema: FastifySchema = {
  querystring: toJsonSchema(AvailableOrdersQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(z.array(AvailableOrderItemZ))),
  },
};
export const cancelOrderSchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(CancelOrderRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(CancelOrderResultZ)),
  },
};
export const acceptOrderSchema: FastifySchema = {
  params: paramsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(AcceptOrderResultZ)),
  },
};
export const updateOrderStatusSchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(UpdateOrderStatusRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(UpdateOrderStatusResponseZ)),
  },
};
export const rateOrderSchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(RateOrderRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
  },
};

// ── Driver order action schemas ─────────────────────────────────────────────

export const arriveSchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(ArriveRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(ArrivePayloadZ)),
  },
};
export const undeliverableSchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(UndeliverableRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(UndeliverablePayloadZ)),
  },
};
export const returnSchema: FastifySchema = {
  params: paramsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(ReturnPayloadZ)),
  },
};
export const returnedSchema: FastifySchema = {
  params: paramsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(ReturnedPayloadZ)),
  },
};
export const proofOfDeliverySchema: FastifySchema = {
  params: paramsJson,
  body: toJsonSchema(ProofOfDeliveryRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(ProofOfDeliveryPayloadZ)),
  },
};
export const trackingSchema: FastifySchema = {
  params: paramsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(TrackingPayloadZ)),
  },
};
