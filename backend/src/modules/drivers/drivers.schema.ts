// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  ActiveAssignmentsResponseZ,
  DriverAvailabilityResponseZ,
  DriverEarningsSummaryResponseZ,
  DriverLocationResponseZ,
  DriverProfileMutationResponseZ,
  EarningsPeriodQueryZ,
  DriverProfileResponseZ,
  DriverRatingResponseZ,
  UpdateDriverProfileRequestZ,
  UpdateAvailabilityRequestZ,
  UpdateLocationRequestZ,
} from "./drivers.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const UpdateDriverProfileJson = zodToJsonSchema(
  UpdateDriverProfileRequestZ as unknown as ZodToJsonSchemaInput,
);
const UpdateAvailabilityJson = zodToJsonSchema(
  UpdateAvailabilityRequestZ as unknown as ZodToJsonSchemaInput,
);
const UpdateLocationJson = zodToJsonSchema(
  UpdateLocationRequestZ as unknown as ZodToJsonSchemaInput,
);
const DriverProfileResponseJson = zodToJsonSchema(
  DriverProfileResponseZ as unknown as ZodToJsonSchemaInput,
);
const DriverProfileMutationResponseJson = zodToJsonSchema(
  DriverProfileMutationResponseZ as unknown as ZodToJsonSchemaInput,
);
const DriverAvailabilityResponseJson = zodToJsonSchema(
  DriverAvailabilityResponseZ as unknown as ZodToJsonSchemaInput,
);
const DriverLocationResponseJson = zodToJsonSchema(
  DriverLocationResponseZ as unknown as ZodToJsonSchemaInput,
);
const ActiveAssignmentsResponseJson = zodToJsonSchema(
  ActiveAssignmentsResponseZ as unknown as ZodToJsonSchemaInput,
);
const DriverEarningsSummaryResponseJson = zodToJsonSchema(
  DriverEarningsSummaryResponseZ as unknown as ZodToJsonSchemaInput,
);
const DriverRatingResponseJson = zodToJsonSchema(
  DriverRatingResponseZ as unknown as ZodToJsonSchemaInput,
);
const EarningsPeriodQueryJson = zodToJsonSchema(
  EarningsPeriodQueryZ as unknown as ZodToJsonSchemaInput,
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

export const getDriverProfileSchema: FastifySchema = {
  response: {
    200: successEnvelope(DriverProfileResponseJson),
  },
};

export const updateDriverProfileSchema: FastifySchema = {
  body: UpdateDriverProfileJson,
  response: {
    200: successEnvelope(DriverProfileMutationResponseJson),
  },
};

export const updateAvailabilitySchema: FastifySchema = {
  body: UpdateAvailabilityJson,
  response: {
    200: successEnvelope(DriverAvailabilityResponseJson),
  },
};

export const updateLocationSchema: FastifySchema = {
  body: UpdateLocationJson,
  response: {
    200: successEnvelope(DriverLocationResponseJson),
  },
};

export const getActiveAssignmentsSchema: FastifySchema = {
  response: {
    200: successEnvelope(ActiveAssignmentsResponseJson),
  },
};

export const getEarningsSchema: FastifySchema = {
  querystring: EarningsPeriodQueryJson,
  response: {
    200: successEnvelope(DriverEarningsSummaryResponseJson),
  },
};

export const getDriverRatingSchema: FastifySchema = {
  response: {
    200: successEnvelope(DriverRatingResponseJson),
  },
};
