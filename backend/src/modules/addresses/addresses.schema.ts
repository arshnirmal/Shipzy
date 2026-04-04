// services/backend/src/modules/addresses/addresses.schema.ts
import { FastifySchema } from "fastify";
import { zodToJsonSchema } from "zod-to-json-schema";
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

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

const SearchAddressesJson = zodToJsonSchema(
  SearchAddressesZ as unknown as ZodToJsonSchemaInput,
);
const ReverseGeocodeJson = zodToJsonSchema(
  ReverseGeocodeZ as unknown as ZodToJsonSchemaInput,
);
const RetrievePlaceJson = zodToJsonSchema(
  RetrievePlaceZ as unknown as ZodToJsonSchemaInput,
);
const DirectionsJson = zodToJsonSchema(
  DirectionsZ as unknown as ZodToJsonSchemaInput,
);
const DistanceJson = zodToJsonSchema(
  DistanceZ as unknown as ZodToJsonSchemaInput,
);

const SearchAddressesResponseJson = zodToJsonSchema(
  SearchAddressesResponseZ as unknown as ZodToJsonSchemaInput,
);
const RetrievePlaceResponseJson = zodToJsonSchema(
  RetrievePlaceResponseZ as unknown as ZodToJsonSchemaInput,
);
const ReverseGeocodeResponseJson = zodToJsonSchema(
  ReverseGeocodeResponseZ as unknown as ZodToJsonSchemaInput,
);
const DirectionsResponseJson = zodToJsonSchema(
  DirectionsResponseZ as unknown as ZodToJsonSchemaInput,
);
const DistanceResponseJson = zodToJsonSchema(
  DistanceResponseZ as unknown as ZodToJsonSchemaInput,
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

export const searchAddressesSchema: FastifySchema = {
  body: SearchAddressesJson,
  response: {
    200: successEnvelope(SearchAddressesResponseJson),
  },
};
export const reverseGeocodeSchema: FastifySchema = {
  body: ReverseGeocodeJson,
  response: {
    200: successEnvelope(ReverseGeocodeResponseJson),
  },
};
export const retrievePlaceSchema: FastifySchema = {
  body: RetrievePlaceJson,
  response: {
    200: successEnvelope(RetrievePlaceResponseJson),
  },
};
export const getDirectionsSchema: FastifySchema = {
  body: DirectionsJson,
  response: {
    200: successEnvelope(DirectionsResponseJson),
  },
};
export const calculateDistanceSchema: FastifySchema = {
  body: DistanceJson,
  response: {
    200: successEnvelope(DistanceResponseJson),
  },
};
