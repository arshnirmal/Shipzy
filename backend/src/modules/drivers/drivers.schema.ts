// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateDriverProfileRequestZ,
  UpdateAvailabilityRequestZ,
  UpdateLocationRequestZ,
  DriverProfileResponseZ,
} from "./drivers.zod.js";

const UpdateDriverProfileJson = zodToJsonSchema(
  UpdateDriverProfileRequestZ as any,
);
const UpdateAvailabilityJson = zodToJsonSchema(UpdateAvailabilityRequestZ as any);
const UpdateLocationJson = zodToJsonSchema(UpdateLocationRequestZ as any);
const DriverProfileResponseJson = zodToJsonSchema(DriverProfileResponseZ as any);

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
