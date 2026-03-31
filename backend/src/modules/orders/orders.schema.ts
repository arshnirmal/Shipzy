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
} from "./orders.zod.js";

const _CalculateFareJson = zodToJsonSchema(
  CalculateFareRequestZ as any,
  "CalculateFare",
);
const CalculateFareJson =
  (_CalculateFareJson.definitions &&
    (_CalculateFareJson.definitions as any).CalculateFare) ||
  _CalculateFareJson;
const _CreateOrderJson = zodToJsonSchema(
  CreateOrderRequestZ as any,
  "CreateOrder",
);
const CreateOrderJson =
  (_CreateOrderJson.definitions &&
    (_CreateOrderJson.definitions as any).CreateOrder) ||
  _CreateOrderJson;
const _RateOrderJson = zodToJsonSchema(RateOrderRequestZ as any, "RateOrder");
const RateOrderJson =
  (_RateOrderJson.definitions &&
    (_RateOrderJson.definitions as any).RateOrder) ||
  _RateOrderJson;
const _CancelOrderJson = zodToJsonSchema(
  CancelOrderRequestZ as any,
  "CancelOrder",
);
const CancelOrderJson =
  (_CancelOrderJson.definitions &&
    (_CancelOrderJson.definitions as any).CancelOrder) ||
  _CancelOrderJson;
const _UpdateOrderStatusJson = zodToJsonSchema(
  UpdateOrderStatusRequestZ as any,
  "UpdateOrderStatus",
);
const UpdateOrderStatusJson =
  (_UpdateOrderStatusJson.definitions &&
    (_UpdateOrderStatusJson.definitions as any).UpdateOrderStatus) ||
  _UpdateOrderStatusJson;
const _OrderParamsJson = zodToJsonSchema(OrderParamsZ as any, "OrderParams");
const OrderParamsJson =
  (_OrderParamsJson.definitions &&
    (_OrderParamsJson.definitions as any).OrderParams) ||
  _OrderParamsJson;
const _ListOrdersQueryJson = zodToJsonSchema(
  ListOrdersQueryZ as any,
  "ListOrdersQuery",
);
const ListOrdersQueryJson =
  (_ListOrdersQueryJson.definitions &&
    (_ListOrdersQueryJson.definitions as any).ListOrdersQuery) ||
  _ListOrdersQueryJson;
const _GetAvailableOrdersQueryJson = zodToJsonSchema(
  AvailableOrdersQueryZ as any,
  "GetAvailableOrdersQuery",
);
const GetAvailableOrdersQueryJson =
  (_GetAvailableOrdersQueryJson.definitions &&
    (_GetAvailableOrdersQueryJson.definitions as any)
      .GetAvailableOrdersQuery) ||
  _GetAvailableOrdersQueryJson;

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
