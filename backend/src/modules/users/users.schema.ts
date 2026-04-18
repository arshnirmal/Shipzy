// services/backend/src/modules/users/users.schema.ts
import { FastifySchema } from "fastify";
import {
  UpdateProfileRequestZ,
  SaveAddressRequestZ,
  DeleteAddressParamsZ,
  UserProfileResponseZ,
  SaveAddressResponseZ,
  DeleteAddressResponseZ,
  UserAddressesResponseZ,
  RegisterDeviceTokenRequestZ,
  RegisterDeviceTokenResponseZ,
} from "./users.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const UpdateProfileJson = toJsonSchema(UpdateProfileRequestZ);
const SaveAddressJson = toJsonSchema(SaveAddressRequestZ);
const DeleteAddressParamsJson = toJsonSchema(DeleteAddressParamsZ);
const UserResponseJson = toJsonSchema(UserProfileResponseZ);
const SaveAddressResponseJson = toJsonSchema(SaveAddressResponseZ);
const DeleteAddressResponseJson = toJsonSchema(DeleteAddressResponseZ);
const UserAddressesResponseJson = toJsonSchema(UserAddressesResponseZ);
const RegisterDeviceTokenJson = toJsonSchema(RegisterDeviceTokenRequestZ);
const RegisterDeviceTokenResponseJson = toJsonSchema(
  RegisterDeviceTokenResponseZ,
);

export const updateProfileSchema: FastifySchema = {
  body: UpdateProfileJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(UserResponseJson),
  },
};

export const saveAddressSchema: FastifySchema = {
  body: SaveAddressJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(SaveAddressResponseJson),
  },
};

export const deleteAddressSchema: FastifySchema = {
  params: DeleteAddressParamsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DeleteAddressResponseJson),
  },
};

export const getAddressesSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(UserAddressesResponseJson),
  },
};

export const getCurrentUserSchema: FastifySchema = {
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(UserResponseJson),
  },
};

export const registerDeviceTokenSchema: FastifySchema = {
  body: RegisterDeviceTokenJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(RegisterDeviceTokenResponseJson),
  },
};
