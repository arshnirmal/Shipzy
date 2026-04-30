import { zodToJsonSchema } from "zod-to-json-schema";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];

export const toJsonSchema = (schema: unknown) =>
  zodToJsonSchema(schema as unknown as ZodToJsonSchemaInput);

export const successEnvelope = (data: unknown) => ({
  type: "object",
  additionalProperties: false,
  properties: {
    success: { const: true },
    message: { type: "string" },
    data,
    timestamp: { type: "string", format: "date-time" },
  },
  required: ["success", "message", "data", "timestamp"],
});

export const paginatedEnvelope = (item: unknown) => ({
  type: "object",
  additionalProperties: false,
  properties: {
    success: { const: true },
    message: { type: "string" },
    data: {
      type: "array",
      items: item,
    },
    meta: {
      type: "object",
      additionalProperties: false,
      properties: {
        pagination: {
          type: "object",
          additionalProperties: false,
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            totalPages: { type: "number" },
          },
          required: ["page", "limit", "total", "totalPages"],
        },
      },
      required: ["pagination"],
    },
    timestamp: { type: "string", format: "date-time" },
  },
  required: ["success", "message", "data", "meta", "timestamp"],
});

export const errorEnvelope = {
  type: "object",
  additionalProperties: false,
  properties: {
    success: { const: false },
    message: { type: "string" },
    errors: {
      anyOf: [
        { type: "array" },
        { type: "object" },
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" },
      ],
    },
    error: { type: "string" },
    statusCode: { type: "integer" },
    path: { type: "string" },
    retryAfter: {
      anyOf: [{ type: "number" }, { type: "null" }],
    },
    timestamp: { type: "string", format: "date-time" },
  },
  // Only "message" is required: Fastify's fallbackErrorHandler serializes raw
  // Error objects (which lack "success" and "timestamp") against this schema
  // before our custom setErrorHandler can intercept. Keeping those optional
  // prevents a FST_ERR_FAILED_ERROR_SERIALIZATION crash in that fallback path.
  required: ["message"],
};

export const COMMON_ERROR_RESPONSES = {
  400: errorEnvelope,
  401: errorEnvelope,
  403: errorEnvelope,
  404: errorEnvelope,
  409: errorEnvelope,
  429: errorEnvelope,
  500: errorEnvelope,
};
