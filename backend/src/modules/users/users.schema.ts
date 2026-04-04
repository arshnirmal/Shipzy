// services/backend/src/modules/users/users.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateProfileRequestZ,
  SaveAddressRequestZ,
  DeleteAddressParamsZ,
  UserProfileResponseZ,
  SaveAddressResponseZ,
  DeleteAddressResponseZ,
  UserAddressesResponseZ,
} from "./users.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const UpdateProfileJson = zodToJsonSchema(
  UpdateProfileRequestZ as unknown as ZodToJsonSchemaInput,
);
const SaveAddressJson = zodToJsonSchema(
  SaveAddressRequestZ as unknown as ZodToJsonSchemaInput,
);
const DeleteAddressParamsJson = zodToJsonSchema(
  DeleteAddressParamsZ as unknown as ZodToJsonSchemaInput,
);
const UserResponseJson = zodToJsonSchema(
  UserProfileResponseZ as unknown as ZodToJsonSchemaInput,
);
const SaveAddressResponseJson = zodToJsonSchema(
  SaveAddressResponseZ as unknown as ZodToJsonSchemaInput,
);
const DeleteAddressResponseJson = zodToJsonSchema(
  DeleteAddressResponseZ as unknown as ZodToJsonSchemaInput,
);
const UserAddressesResponseJson = zodToJsonSchema(
  UserAddressesResponseZ as unknown as ZodToJsonSchemaInput,
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

export const updateProfileSchema: FastifySchema = {
  body: UpdateProfileJson,
  response: {
    200: successEnvelope(UserResponseJson),
  },
};

export const saveAddressSchema: FastifySchema = {
  body: SaveAddressJson,
  response: {
    201: successEnvelope(SaveAddressResponseJson),
  },
};

export const deleteAddressSchema: FastifySchema = {
  params: DeleteAddressParamsJson,
  response: {
    200: successEnvelope(DeleteAddressResponseJson),
  },
};

export const getAddressesSchema: FastifySchema = {
  response: {
    200: successEnvelope(UserAddressesResponseJson),
  },
};

export const getCurrentUserSchema: FastifySchema = {
  response: {
    200: successEnvelope(UserResponseJson),
  },
};
