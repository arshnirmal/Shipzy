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

const SearchAddressesJson = zodToJsonSchema(SearchAddressesZ as any);
const ReverseGeocodeJson = zodToJsonSchema(ReverseGeocodeZ as any);
const RetrievePlaceJson = zodToJsonSchema(RetrievePlaceZ as any);
const DirectionsJson = zodToJsonSchema(DirectionsZ as any);
const DistanceJson = zodToJsonSchema(DistanceZ as any);

export const searchAddressesSchema: FastifySchema = {
  body: SearchAddressesJson,
};
export const reverseGeocodeSchema: FastifySchema = { body: ReverseGeocodeJson };
export const retrievePlaceSchema: FastifySchema = { body: RetrievePlaceJson };
export const getDirectionsSchema: FastifySchema = { body: DirectionsJson };
export const calculateDistanceSchema: FastifySchema = { body: DistanceJson };
