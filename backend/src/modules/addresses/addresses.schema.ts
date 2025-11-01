// services/backend/src/modules/addresses/addresses.schema.ts
import { FastifySchema } from "fastify";

export const searchAddressesSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["query"],
    properties: {
      query: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Search query for addresses",
      },
      proximity: {
        type: "object",
        properties: {
          longitude: { type: "number", minimum: -180, maximum: 180 },
          latitude: { type: "number", minimum: -90, maximum: 90 },
        },
        description: "Optional proximity point for search results",
      },
      country: {
        type: "string",
        pattern: "^[A-Z]{2}(,[A-Z]{2})*$",
        description: "ISO 3166 country codes (e.g., 'US' or 'US,CA')",
      },
      types: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "address",
            "poi",
            "place",
            "neighborhood",
            "locality",
            "region",
            "country",
          ],
        },
        description: "Feature types to include in results",
      },
      limit: {
        type: "number",
        minimum: 1,
        maximum: 10,
        default: 5,
        description: "Maximum number of results to return",
      },
    },
  },
};

export const reverseGeocodeSchema: FastifySchema = {
  body: {
    type: "object",
    required: ["longitude", "latitude"],
    properties: {
      longitude: {
        type: "number",
        minimum: -180,
        maximum: 180,
        description: "Longitude coordinate",
      },
      latitude: {
        type: "number",
        minimum: -90,
        maximum: 90,
        description: "Latitude coordinate",
      },
      types: {
        type: "array",
        items: {
          type: "string",
          enum: [
            "address",
            "poi",
            "place",
            "neighborhood",
            "locality",
            "region",
            "country",
          ],
        },
        description: "Feature types to include in results",
      },
    },
  },
};
