// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateDriverProfileZ,
  UpdateAvailabilityZ,
  UpdateLocationZ,
  DriverProfileResponseZ,
} from "./drivers.zod.js";

const UpdateDriverProfileJson = zodToJsonSchema(
  UpdateDriverProfileZ as any,
  "UpdateDriverProfile",
);
const UpdateAvailabilityJson = zodToJsonSchema(
  UpdateAvailabilityZ as any,
  "UpdateAvailability",
);
const UpdateLocationJson = zodToJsonSchema(
  UpdateLocationZ as any,
  "UpdateLocation",
);
const DriverProfileResponseJson = zodToJsonSchema(
  DriverProfileResponseZ as any,
  "DriverProfileResponse",
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
