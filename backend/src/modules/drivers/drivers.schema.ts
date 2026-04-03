// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  EarningsPeriodQueryZ,
  UpdateDriverProfileRequestZ,
  UpdateAvailabilityRequestZ,
  UpdateLocationRequestZ,
  DriverProfileResponseZ,
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
const EarningsPeriodQueryJson = zodToJsonSchema(
  EarningsPeriodQueryZ as unknown as ZodToJsonSchemaInput,
);

export const updateDriverProfileSchema: FastifySchema = {
  body: UpdateDriverProfileJson,
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: DriverProfileResponseJson,
      },
    },
  },
};

export const updateAvailabilitySchema: FastifySchema = {
  body: UpdateAvailabilityJson,
};

export const updateLocationSchema: FastifySchema = {
  body: UpdateLocationJson,
};

export const getEarningsSchema: FastifySchema = {
  querystring: EarningsPeriodQueryJson,
};
