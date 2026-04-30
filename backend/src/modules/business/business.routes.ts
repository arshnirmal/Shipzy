import { FastifyInstance } from "fastify";
import { authorize } from "../../middleware/auth.middleware.js";
import businessController from "./business.controller.js";
import {
  deleteDraftSchema,
  deleteTemplateSchema,
  createDraftSchema,
  listDraftsSchema,
  getDraftSchema,
  updateDraftSchema,
  submitDraftSchema,
  createTemplateSchema,
  listTemplatesSchema,
  getTemplateSchema,
  updateTemplateSchema,
  draftFromTemplateSchema,
  bulkCreateOrdersSchema,
  bulkCancelOrdersSchema,
  exportOrdersSchema,
  getAnalyticsSchema,
} from "./business.schema.js";

export default async function businessRoutes(app: FastifyInstance) {
  // Apply authentication to all business routes
  app.addHook("preHandler", app.authenticate);

  // Require "business" role for all routes in this plugin
  app.addHook("preHandler", authorize("business"));

  // =========================================================================
  // DRAFTS
  // =========================================================================

  app.post(
    "/drafts",
    { schema: createDraftSchema },
    businessController.createDraft.bind(businessController),
  );

  app.get(
    "/drafts",
    { schema: listDraftsSchema },
    businessController.listDrafts.bind(businessController),
  );

  app.get(
    "/drafts/:id",
    { schema: getDraftSchema },
    businessController.getDraft.bind(businessController),
  );

  app.patch(
    "/drafts/:id",
    { schema: updateDraftSchema },
    businessController.updateDraft.bind(businessController),
  );

  app.delete(
    "/drafts/:id",
    { schema: deleteDraftSchema },
    businessController.deleteDraft.bind(businessController),
  );

  app.post(
    "/drafts/:id/submit",
    { schema: submitDraftSchema },
    businessController.submitDraft.bind(businessController),
  );

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  app.post(
    "/templates",
    { schema: createTemplateSchema },
    businessController.createTemplate.bind(businessController),
  );

  app.get(
    "/templates",
    { schema: listTemplatesSchema },
    businessController.listTemplates.bind(businessController),
  );

  app.get(
    "/templates/:id",
    { schema: getTemplateSchema },
    businessController.getTemplate.bind(businessController),
  );

  app.patch(
    "/templates/:id",
    { schema: updateTemplateSchema },
    businessController.updateTemplate.bind(businessController),
  );

  app.delete(
    "/templates/:id",
    { schema: deleteTemplateSchema },
    businessController.deleteTemplate.bind(businessController),
  );

  app.post(
    "/templates/:id/draft",
    { schema: draftFromTemplateSchema },
    businessController.createDraftFromTemplate.bind(businessController),
  );

  // =========================================================================
  // ORDERS / BULK
  // =========================================================================

  app.post(
    "/orders/bulk",
    { schema: bulkCreateOrdersSchema },
    businessController.bulkCreateOrders.bind(businessController),
  );

  app.post(
    "/orders/bulk-cancel",
    { schema: bulkCancelOrdersSchema },
    businessController.bulkCancelOrders.bind(businessController),
  );

  app.get(
    "/orders/export",
    { schema: exportOrdersSchema },
    businessController.exportOrders.bind(businessController),
  );

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  app.get(
    "/analytics",
    { schema: getAnalyticsSchema },
    businessController.getAnalytics.bind(businessController),
  );
}
