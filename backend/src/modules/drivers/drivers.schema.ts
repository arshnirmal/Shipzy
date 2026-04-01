// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateDriverProfileRequestZ,
  UpdateAvailabilityRequestZ,
  UpdateLocationRequestZ,
  DriverProfileResponseZ,
} from "./drivers.zod.js";

const _UpdateDriverProfileJson = zodToJsonSchema(
  UpdateDriverProfileRequestZ as any,
  "UpdateDriverProfile",
);
const UpdateDriverProfileJson =
  (_UpdateDriverProfileJson.definitions &&
    (_UpdateDriverProfileJson.definitions as any).UpdateDriverProfile) ||
  _UpdateDriverProfileJson;
const _UpdateAvailabilityJson = zodToJsonSchema(
  UpdateAvailabilityRequestZ as any,
  "UpdateAvailability",
);
const UpdateAvailabilityJson =
  (_UpdateAvailabilityJson.definitions &&
    (_UpdateAvailabilityJson.definitions as any).UpdateAvailability) ||
  _UpdateAvailabilityJson;
const _UpdateLocationJson = zodToJsonSchema(
  UpdateLocationRequestZ as any,
  "UpdateLocation",
);
const UpdateLocationJson =
  (_UpdateLocationJson.definitions &&
    (_UpdateLocationJson.definitions as any).UpdateLocation) ||
  _UpdateLocationJson;
const _DriverProfileResponseJson = zodToJsonSchema(
  DriverProfileResponseZ as any,
  "DriverProfileResponse",
);
const DriverProfileResponseJson =
  (_DriverProfileResponseJson.definitions &&
    (_DriverProfileResponseJson.definitions as any).DriverProfileResponse) ||
  _DriverProfileResponseJson;

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
