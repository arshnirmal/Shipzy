// services/backend/src/modules/drivers/drivers.schema.ts
import { FastifySchema } from "fastify";

export const updateDriverProfileSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 100 },
      email: { type: "string", format: "email" },
      profilePictureUrl: { type: "string", format: "uri" },
    },
  },
};

export const updateAvailabilitySchema: FastifySchema = {
  body: {
    type: "object",
    required: ["isAvailable", "isOnline"],
    properties: {
      isAvailable: { type: "boolean" },
      isOnline: { type: "boolean" },
    },
  },
};

export const updateLocationSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["latitude", "longitude"],
    properties: {
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
    },
  },
};
