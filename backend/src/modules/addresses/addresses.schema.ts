// services/backend/src/modules/addresses/addresses.schema.ts
import { FastifySchema } from "fastify";
import {
  DirectionsResponseZ,
  DirectionsZ,
  DistanceResponseZ,
  DistanceZ,
  RetrievePlaceResponseZ,
  RetrievePlaceZ,
  ReverseGeocodeResponseZ,
  ReverseGeocodeZ,
  SearchAddressesResponseZ,
  SearchAddressesZ,
} from "./addresses.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const SearchAddressesJson = toJsonSchema(SearchAddressesZ);
const ReverseGeocodeJson = toJsonSchema(ReverseGeocodeZ);
const RetrievePlaceJson = toJsonSchema(RetrievePlaceZ);
const DirectionsJson = toJsonSchema(DirectionsZ);
const DistanceJson = toJsonSchema(DistanceZ);

const SearchAddressesResponseJson = toJsonSchema(SearchAddressesResponseZ);
const RetrievePlaceResponseJson = toJsonSchema(RetrievePlaceResponseZ);
const ReverseGeocodeResponseJson = toJsonSchema(ReverseGeocodeResponseZ);
const DirectionsResponseJson = toJsonSchema(DirectionsResponseZ);
const DistanceResponseJson = toJsonSchema(DistanceResponseZ);

export const searchAddressesSchema: FastifySchema = {
  body: SearchAddressesJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(SearchAddressesResponseJson),
  },
};
export const reverseGeocodeSchema: FastifySchema = {
  body: ReverseGeocodeJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(ReverseGeocodeResponseJson),
  },
};
export const retrievePlaceSchema: FastifySchema = {
  body: RetrievePlaceJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(RetrievePlaceResponseJson),
  },
};
export const getDirectionsSchema: FastifySchema = {
  body: DirectionsJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DirectionsResponseJson),
  },
};
export const calculateDistanceSchema: FastifySchema = {
  body: DistanceJson,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(DistanceResponseJson),
  },
};
