// services/backend/src/modules/orders/orders.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CalculateFareZ,
  CreateOrderZ,
  RateOrderZ,
  CancelOrderZ,
  UpdateOrderStatusZ,
  OrderParamsZ,
  ListOrdersQueryZ,
  GetAvailableOrdersQueryZ,
} from "./orders.zod.js";

const CalculateFareJson = zodToJsonSchema(
  CalculateFareZ as any,
  "CalculateFare",
);
const CreateOrderJson = zodToJsonSchema(CreateOrderZ as any, "CreateOrder");
const RateOrderJson = zodToJsonSchema(RateOrderZ as any, "RateOrder");
const CancelOrderJson = zodToJsonSchema(CancelOrderZ as any, "CancelOrder");
const UpdateOrderStatusJson = zodToJsonSchema(
  UpdateOrderStatusZ as any,
  "UpdateOrderStatus",
);
const OrderParamsJson = zodToJsonSchema(OrderParamsZ as any, "OrderParams");
const ListOrdersQueryJson = zodToJsonSchema(
  ListOrdersQueryZ as any,
  "ListOrdersQuery",
);
const GetAvailableOrdersQueryJson = zodToJsonSchema(
  GetAvailableOrdersQueryZ as any,
  "GetAvailableOrdersQuery",
);

export const calculateFareSchema: FastifySchema = {
  body: CalculateFareJson,
};

export const createOrderSchema: FastifySchema = {
  body: CreateOrderJson,
};

export const getOrderByIdSchema: FastifySchema = {
  params: OrderParamsJson,
};

export const listOrdersSchema: FastifySchema = {
  querystring: ListOrdersQueryJson,
};

export const getAvailableOrdersSchema: FastifySchema = {
  querystring: GetAvailableOrdersQueryJson,
};

export const cancelOrderSchema: FastifySchema = {
  params: OrderParamsJson,
  body: CancelOrderJson,
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
  params: OrderParamsJson,
  body: UpdateOrderStatusJson,
};

// New: rate order schema (route-level validation)
export const rateOrderSchema: FastifySchema = {
  params: OrderParamsJson,
  body: RateOrderJson,
};
