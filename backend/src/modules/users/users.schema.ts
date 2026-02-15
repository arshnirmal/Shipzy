// services/backend/src/modules/users/users.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateProfileZ,
  SaveAddressZ,
  DeleteAddressParamsZ,
  UserResponseZ,
  AddressResponseZ,
  AddressesArrayZ,
} from "./users.zod.js";

const UpdateProfileJson = zodToJsonSchema(
  UpdateProfileZ as any,
  "UpdateProfile",
);
const SaveAddressJson = zodToJsonSchema(SaveAddressZ as any, "SaveAddress");
const DeleteAddressParamsJson = zodToJsonSchema(
  DeleteAddressParamsZ as any,
  "DeleteAddressParams",
);
const UserResponseJson = zodToJsonSchema(UserResponseZ as any, "UserResponse");
const AddressResponseJson = zodToJsonSchema(
  AddressResponseZ as any,
  "AddressResponse",
);
const AddressesArrayJson = zodToJsonSchema(
  AddressesArrayZ as any,
  "AddressesArray",
);

export const updateProfileSchema: FastifySchema = {
  body: UpdateProfileJson,
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: UserResponseJson,
      },
    },
  },
};

export const saveAddressSchema: FastifySchema = {
  body: SaveAddressJson,
  response: {
    201: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: AddressResponseJson,
      },
    },
  },
};

export const deleteAddressSchema: FastifySchema = {
  params: DeleteAddressParamsJson,
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: { type: "object" },
      },
    },
  },
};

export const getAddressesSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: AddressesArrayJson,
      },
    },
  },
};

export const getCurrentUserSchema: FastifySchema = {
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string" },
        data: UserResponseJson,
      },
    },
  },
};
