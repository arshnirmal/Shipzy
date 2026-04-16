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
  AnalyticsQueryZ,
  AnalyticsResponseZ,
} from "./business.zod.js";
import { IdParamZ } from "../../schemas/common.zod.js";
import {
  BulkCancelRequestZ,
  BulkCancelResultZ,
  CreateOrderResponseZ,
} from "../orders/orders.zod.js";
import {
  COMMON_ERROR_RESPONSES,
  successEnvelope,
  toJsonSchema,
} from "../../schemas/response.schema.js";

const idParamsSchema = toJsonSchema(IdParamZ);
const deleteResponseSchema = toJsonSchema(
  z
    .object({
      deletion: z.object({ success: z.boolean() }).strict(),
    })
    .strict(),
);

export const createDraftSchema = {
  body: toJsonSchema(DraftCreateRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(DraftResponseZ)),
  },
};

export const listDraftsSchema = {
  querystring: toJsonSchema(ListDraftsQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(
      toJsonSchema(
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
    ),
  },
};

export const getDraftSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(DraftResponseZ)),
  },
};

export const updateDraftSchema = {
  params: idParamsSchema,
  body: toJsonSchema(DraftUpdateRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(DraftResponseZ)),
  },
};

export const submitDraftSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(CreateOrderResponseZ)),
  },
};

export const deleteDraftSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(deleteResponseSchema),
  },
};

export const createTemplateSchema = {
  body: toJsonSchema(TemplateCreateRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(TemplateResponseZ)),
  },
};

export const listTemplatesSchema = {
  querystring: toJsonSchema(ListTemplatesQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(
      toJsonSchema(
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
    ),
  },
};

export const getTemplateSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(TemplateResponseZ)),
  },
};

export const updateTemplateSchema = {
  params: idParamsSchema,
  body: toJsonSchema(TemplateUpdateRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(TemplateResponseZ)),
  },
};

export const deleteTemplateSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(deleteResponseSchema),
  },
};

export const draftFromTemplateSchema = {
  params: idParamsSchema,
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(DraftResponseZ)),
  },
};

export const bulkCreateOrdersSchema = {
  body: toJsonSchema(BulkOrderCreateRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    201: successEnvelope(toJsonSchema(BulkOrderResultZ)),
  },
};

export const bulkCancelOrdersSchema = {
  body: toJsonSchema(BulkCancelRequestZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(BulkCancelResultZ)),
  },
};

// No JSON schema for export (since it's text/csv response)
export const exportOrdersSchema = {
  querystring: toJsonSchema(ExportOrdersQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
  },
};

export const getAnalyticsSchema = {
  querystring: toJsonSchema(AnalyticsQueryZ),
  response: {
    ...COMMON_ERROR_RESPONSES,
    200: successEnvelope(toJsonSchema(AnalyticsResponseZ)),
  },
};
