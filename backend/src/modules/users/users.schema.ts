// services/backend/src/modules/users/users.schema.ts
import { FastifySchema } from "fastify";

export const updateProfileSchema: FastifySchema = {
  body: {
    type: "object",
    properties: {
      fullName: { type: "string", minLength: 2, maxLength: 100 },
      email: { type: "string", format: "email" },
      profilePictureUrl: { type: "string", format: "uri" },
    },
  },
};

export const saveAddressSchema: FastifySchema = {
  body: {
    type: "object",
    required: [
      "label",
      "fullAddress",
      "city",
      "state",
      "postalCode",
      "latitude",
      "longitude",
    ],
    properties: {
      addressType: { type: "string", enum: ["home", "work", "other"] },
      label: { type: "string", minLength: 1, maxLength: 50 },
      fullAddress: { type: "string", minLength: 5, maxLength: 500 },
      building: { type: "string", maxLength: 100 },
      floor: { type: "string", maxLength: 50 },
      flatNumber: { type: "string", maxLength: 50 },
      landmark: { type: "string", maxLength: 200 },
      city: { type: "string", minLength: 2, maxLength: 100 },
      state: { type: "string", minLength: 2, maxLength: 100 },
      postalCode: { type: "string", minLength: 4, maxLength: 10 },
      latitude: { type: "number", minimum: -90, maximum: 90 },
      longitude: { type: "number", minimum: -180, maximum: 180 },
      isDefault: { type: "boolean" },
    },
  },
};

export const deleteAddressSchema: FastifySchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
};
