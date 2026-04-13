import { FastifyInstance } from "fastify";
import businessController from "./business.controller.js";
import {
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
  exportOrdersSchema,
} from "./business.schema.js";

export default async function businessRoutes(app: FastifyInstance) {
  // Apply authentication to all business routes
  app.addHook("onRequest", app.authenticate);

  // Require "business" role for all routes in this plugin
  const { authorize } = await import("../../middleware/auth.middleware.js");
  app.addHook("onRequest", authorize("business"));

  // =========================================================================
  // DRAFTS
  // =========================================================================
  
  app.post(
    "/drafts",
    { schema: createDraftSchema },
    businessController.createDraft
  );

  app.get(
    "/drafts",
    { schema: listDraftsSchema },
    businessController.listDrafts
  );

  app.get(
    "/drafts/:id",
    { schema: getDraftSchema },
    businessController.getDraft
  );

  app.patch(
    "/drafts/:id",
    { schema: updateDraftSchema },
    businessController.updateDraft
  );

  app.delete(
    "/drafts/:id",
    businessController.deleteDraft
  );

  app.post(
    "/drafts/:id/submit",
    { schema: submitDraftSchema },
    businessController.submitDraft
  );

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  app.post(
    "/templates",
    { schema: createTemplateSchema },
    businessController.createTemplate
  );

  app.get(
    "/templates",
    { schema: listTemplatesSchema },
    businessController.listTemplates
  );

  app.get(
    "/templates/:id",
    { schema: getTemplateSchema },
    businessController.getTemplate
  );

  app.patch(
    "/templates/:id",
    { schema: updateTemplateSchema },
    businessController.updateTemplate
  );

  app.delete(
    "/templates/:id",
    businessController.deleteTemplate
  );

  app.post(
    "/templates/:id/draft",
    { schema: draftFromTemplateSchema },
    businessController.createDraftFromTemplate
  );

  // =========================================================================
  // ORDERS / BULK
  // =========================================================================

  app.post(
    "/orders/bulk",
    { schema: bulkCreateOrdersSchema },
    businessController.bulkCreateOrders
  );

  app.get(
    "/orders/export",
    { schema: exportOrdersSchema },
    businessController.exportOrders
  );
}
