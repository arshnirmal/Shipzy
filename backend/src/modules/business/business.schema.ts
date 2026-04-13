import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";
import {
  DraftResponseZ,
  DraftCreateRequestZ,
  DraftUpdateRequestZ,
  ListDraftsQueryZ,
  TemplateResponseZ,
  TemplateCreateRequestZ,
  TemplateUpdateRequestZ,
  ListTemplatesQueryZ,
  BulkOrderCreateRequestZ,
  BulkOrderResultZ,
  ExportOrdersQueryZ,
} from "./business.zod.js";
import { CreateOrderResponseZ } from "../orders/orders.zod.js";

type ZodToJsonSchemaInput = Parameters<typeof zodToJsonSchema>[0];
function toJsonSchema(schema: any) {
  return zodToJsonSchema(schema as unknown as ZodToJsonSchemaInput);
}

export const createDraftSchema = {
  body: toJsonSchema(DraftCreateRequestZ),
  response: {
    201: toJsonSchema(DraftResponseZ),
  },
};

export const listDraftsSchema = {
  querystring: toJsonSchema(ListDraftsQueryZ),
  response: {
    200: toJsonSchema(
      z.object({
        drafts: z.array(DraftResponseZ),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      }),
    ),
  },
};

export const getDraftSchema = {
  response: {
    200: toJsonSchema(DraftResponseZ),
  },
};

export const updateDraftSchema = {
  body: toJsonSchema(DraftUpdateRequestZ),
  response: {
    200: toJsonSchema(DraftResponseZ),
  },
};

export const submitDraftSchema = {
  response: {
    201: toJsonSchema(CreateOrderResponseZ),
  },
};

export const createTemplateSchema = {
  body: toJsonSchema(TemplateCreateRequestZ),
  response: {
    201: toJsonSchema(TemplateResponseZ),
  },
};

export const listTemplatesSchema = {
  querystring: toJsonSchema(ListTemplatesQueryZ),
  response: {
    200: toJsonSchema(
      z.object({
        templates: z.array(TemplateResponseZ),
        pagination: z.object({
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          totalPages: z.number(),
        }),
      }),
    ),
  },
};

export const getTemplateSchema = {
  response: {
    200: toJsonSchema(TemplateResponseZ),
  },
};

export const updateTemplateSchema = {
  body: toJsonSchema(TemplateUpdateRequestZ),
  response: {
    200: toJsonSchema(TemplateResponseZ),
  },
};

export const draftFromTemplateSchema = {
  response: {
    201: toJsonSchema(DraftResponseZ),
  },
};

export const bulkCreateOrdersSchema = {
  body: toJsonSchema(BulkOrderCreateRequestZ),
  response: {
    201: toJsonSchema(BulkOrderResultZ),
  },
};

// No JSON schema for export (since it's text/csv response)
export const exportOrdersSchema = {
  querystring: toJsonSchema(ExportOrdersQueryZ),
};
