// services/backend/src/modules/addresses/addresses.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
import {
  SearchAddressesZ,
  ReverseGeocodeZ,
  RetrievePlaceZ,
  DirectionsZ,
  DistanceZ,
} from "./addresses.zod.js";

const _SearchAddressesJson = zodToJsonSchema(
  SearchAddressesZ as any,
  "SearchAddresses",
);
const SearchAddressesJson =
  (_SearchAddressesJson.definitions &&
    (_SearchAddressesJson.definitions as any).SearchAddresses) ||
  _SearchAddressesJson;
const _ReverseGeocodeJson = zodToJsonSchema(
  ReverseGeocodeZ as any,
  "ReverseGeocode",
);
const ReverseGeocodeJson =
  (_ReverseGeocodeJson.definitions &&
    (_ReverseGeocodeJson.definitions as any).ReverseGeocode) ||
  _ReverseGeocodeJson;
const _RetrievePlaceJson = zodToJsonSchema(
  RetrievePlaceZ as any,
  "RetrievePlace",
);
const RetrievePlaceJson =
  (_RetrievePlaceJson.definitions &&
    (_RetrievePlaceJson.definitions as any).RetrievePlace) ||
  _RetrievePlaceJson;
const _DirectionsJson = zodToJsonSchema(DirectionsZ as any, "Directions");
const DirectionsJson =
  (_DirectionsJson.definitions &&
    (_DirectionsJson.definitions as any).Directions) ||
  _DirectionsJson;
const _DistanceJson = zodToJsonSchema(DistanceZ as any, "Distance");
const DistanceJson =
  (_DistanceJson.definitions && (_DistanceJson.definitions as any).Distance) ||
  _DistanceJson;

export const searchAddressesSchema: FastifySchema = {
  body: SearchAddressesJson,
};
export const reverseGeocodeSchema: FastifySchema = { body: ReverseGeocodeJson };
export const retrievePlaceSchema: FastifySchema = { body: RetrievePlaceJson };
export const getDirectionsSchema: FastifySchema = { body: DirectionsJson };
export const calculateDistanceSchema: FastifySchema = { body: DistanceJson };
