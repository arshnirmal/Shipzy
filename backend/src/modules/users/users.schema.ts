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

const _UpdateProfileJson = zodToJsonSchema(
  UpdateProfileRequestZ as any,
  "UpdateProfile",
);
const UpdateProfileJson =
  (_UpdateProfileJson.definitions &&
    (_UpdateProfileJson.definitions as any).UpdateProfile) ||
  _UpdateProfileJson;
const _SaveAddressJson = zodToJsonSchema(
  SaveAddressRequestZ as any,
  "SaveAddress",
);
const SaveAddressJson =
  (_SaveAddressJson.definitions &&
    (_SaveAddressJson.definitions as any).SaveAddress) ||
  _SaveAddressJson;
const _DeleteAddressParamsJson = zodToJsonSchema(
  DeleteAddressParamsZ as any,
  "DeleteAddressParams",
);
const DeleteAddressParamsJson =
  (_DeleteAddressParamsJson.definitions &&
    (_DeleteAddressParamsJson.definitions as any).DeleteAddressParams) ||
  _DeleteAddressParamsJson;
const _UserResponseJson = zodToJsonSchema(
  UserProfileResponseZ as any,
  "UserResponse",
);
const UserResponseJson =
  (_UserResponseJson.definitions &&
    (_UserResponseJson.definitions as any).UserResponse) ||
  _UserResponseJson;
const _AddressResponseJson = zodToJsonSchema(
  SavedAddressResponseZ as any,
  "AddressResponse",
);
const AddressResponseJson =
  (_AddressResponseJson.definitions &&
    (_AddressResponseJson.definitions as any).AddressResponse) ||
  _AddressResponseJson;
const _AddressesArrayJson = zodToJsonSchema(
  AddressesArrayResponseZ as any,
  "AddressesArray",
);
const AddressesArrayJson =
  (_AddressesArrayJson.definitions &&
    (_AddressesArrayJson.definitions as any).AddressesArray) ||
  _AddressesArrayJson;

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
