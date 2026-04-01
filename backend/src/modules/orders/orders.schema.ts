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

const paramsJson = zodToJsonSchema(OrderParamsZ as any);

export const calculateFareSchema: FastifySchema = { body: zodToJsonSchema(CalculateFareRequestZ as any) };
export const createOrderSchema: FastifySchema = { body: zodToJsonSchema(CreateOrderRequestZ as any) };
export const getOrderByIdSchema: FastifySchema = { params: paramsJson };
export const listOrdersSchema: FastifySchema = { querystring: zodToJsonSchema(ListOrdersQueryZ as any) };
export const getAvailableOrdersSchema: FastifySchema = { querystring: zodToJsonSchema(AvailableOrdersQueryZ as any) };
export const cancelOrderSchema: FastifySchema = { params: paramsJson, body: zodToJsonSchema(CancelOrderRequestZ as any) };
export const acceptOrderSchema: FastifySchema = { params: paramsJson };
export const updateOrderStatusSchema: FastifySchema = { params: paramsJson, body: zodToJsonSchema(UpdateOrderStatusRequestZ as any) };
export const rateOrderSchema: FastifySchema = { params: paramsJson, body: zodToJsonSchema(RateOrderRequestZ as any) };
