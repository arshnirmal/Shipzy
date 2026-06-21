// services/backend/src/modules/payments/payments.schema.ts
import { FastifySchema } from "fastify";
import {
  CreatePaymentOrderRequestZ,
  VerifyPaymentRequestZ,
  GenerateQRRequestZ,
  PaymentOrderResponseZ,
  PaymentVerifyResponseZ,
  QRCodeResponseZ,
  PaymentStatusResponseZ,
  OrderPaymentParamsZ,
  DriverEarningsQueryZ,
  DriverEarningsResponseZ,
  DriverPayoutsQueryZ,
  DriverPayoutsResponseZ,
  PaymentParamsZ,
  RefundRequestZ,
  RefundResponseZ,
} from "./payments.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

export const createPaymentOrderSchema: FastifySchema = {
  body: toJsonSchema(CreatePaymentOrderRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(PaymentOrderResponseZ)),
  },
};

export const verifyPaymentSchema: FastifySchema = {
  body: toJsonSchema(VerifyPaymentRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(PaymentVerifyResponseZ)),
  },
};

export const generateQRSchema: FastifySchema = {
  body: toJsonSchema(GenerateQRRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(QRCodeResponseZ)),
  },
};

export const getPaymentStatusSchema: FastifySchema = {
  params: toJsonSchema(OrderPaymentParamsZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(PaymentStatusResponseZ)),
  },
};

export const driverEarningsSchema: FastifySchema = {
  querystring: toJsonSchema(DriverEarningsQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(DriverEarningsResponseZ)),
  },
};

export const driverPayoutsSchema: FastifySchema = {
  querystring: toJsonSchema(DriverPayoutsQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(DriverPayoutsResponseZ)),
  },
};

export const refundSchema: FastifySchema = {
  params: toJsonSchema(PaymentParamsZ),
  body: toJsonSchema(RefundRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(RefundResponseZ)),
  },
};
