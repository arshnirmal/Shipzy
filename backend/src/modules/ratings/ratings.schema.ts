import { FastifySchema } from "fastify";
import {
  CreateRatingParamsZ,
  CreateRatingRequestZ,
  CreateRatingResponseZ,
  DriverRatingParamsZ,
  DriverRatingStatsResponseZ,
} from "./ratings.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const CreateRatingParamsJson = toJsonSchema(CreateRatingParamsZ);
const CreateRatingRequestJson = toJsonSchema(CreateRatingRequestZ);
const CreateRatingResponseJson = toJsonSchema(CreateRatingResponseZ);

const DriverRatingParamsJson = toJsonSchema(DriverRatingParamsZ);
const DriverRatingStatsResponseJson = toJsonSchema(DriverRatingStatsResponseZ);

export const createRatingSchema: FastifySchema = {
  params: CreateRatingParamsJson,
  body: CreateRatingRequestJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(CreateRatingResponseJson),
  },
};

export const getDriverRatingStatsSchema: FastifySchema = {
  params: DriverRatingParamsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DriverRatingStatsResponseJson),
  },
};
