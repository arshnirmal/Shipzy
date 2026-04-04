import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  CreateRatingParamsZ,
  CreateRatingRequestZ,
  CreateRatingResponseZ,
  DriverRatingParamsZ,
  DriverRatingStatsResponseZ,
} from "./ratings.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const CreateRatingParamsJson = zodToJsonSchema(
  CreateRatingParamsZ as unknown as ZodToJsonSchemaInput,
);
const CreateRatingRequestJson = zodToJsonSchema(
  CreateRatingRequestZ as unknown as ZodToJsonSchemaInput,
);
const CreateRatingResponseJson = zodToJsonSchema(
  CreateRatingResponseZ as unknown as ZodToJsonSchemaInput,
);

const DriverRatingParamsJson = zodToJsonSchema(
  DriverRatingParamsZ as unknown as ZodToJsonSchemaInput,
);
const DriverRatingStatsResponseJson = zodToJsonSchema(
  DriverRatingStatsResponseZ as unknown as ZodToJsonSchemaInput,
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

export const createRatingSchema: FastifySchema = {
  params: CreateRatingParamsJson,
  body: CreateRatingRequestJson,
  response: {
    201: successEnvelope(CreateRatingResponseJson),
  },
};

export const getDriverRatingStatsSchema: FastifySchema = {
  params: DriverRatingParamsJson,
  response: {
    200: successEnvelope(DriverRatingStatsResponseJson),
  },
};
