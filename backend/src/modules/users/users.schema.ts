// services/backend/src/modules/users/users.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  UpdateProfileRequestZ,
  SaveAddressRequestZ,
  DeleteAddressParamsZ,
  UserProfileResponseZ,
  SavedAddressResponseZ,
  AddressesArrayResponseZ,
} from "./users.zod.js";

const UpdateProfileJson = zodToJsonSchema(UpdateProfileRequestZ as any);
const SaveAddressJson = zodToJsonSchema(SaveAddressRequestZ as any);
const DeleteAddressParamsJson = zodToJsonSchema(DeleteAddressParamsZ as any);
const UserResponseJson = zodToJsonSchema(UserProfileResponseZ as any);
const AddressResponseJson = zodToJsonSchema(SavedAddressResponseZ as any);
const AddressesArrayJson = zodToJsonSchema(AddressesArrayResponseZ as any);

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
