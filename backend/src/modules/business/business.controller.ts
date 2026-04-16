import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import businessService from "./business.service.js";
import type { BulkCancelRequest } from "../orders/orders.zod.js";
import type { IdParam } from "../../schemas/common.zod.js";
import type {
  AnalyticsQuery,
  BulkOrderCreateRequest,
  DraftCreateRequest,
  DraftUpdateRequest,
  ExportOrdersQuery,
  ListDraftsQuery,
  ListTemplatesQuery,
  TemplateCreateRequest,
  TemplateUpdateRequest,
} from "./business.zod.js";

class BusinessController {
  // =========================================================================
  // DRAFTS
  // =========================================================================

  async createDraft(
    request: FastifyRequest<{ Body: DraftCreateRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const result = await businessService.createDraft(userId, request.body);
      return successResponse(reply, result, "Draft created", 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async getDraft(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: draftId } = request.params;
      const result = await businessService.getDraft(userId, draftId);
      return successResponse(reply, result, "Draft retrieved");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async listDrafts(
    request: FastifyRequest<{ Querystring: ListDraftsQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { page = 1, limit = 20, state } = request.query;
      const result = await businessService.listDrafts(
        userId,
        page,
        limit,
        state,
      );
      return successResponse(reply, result, "Drafts retrieved");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async updateDraft(
    request: FastifyRequest<{ Params: IdParam; Body: DraftUpdateRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: draftId } = request.params;

      const result = await businessService.updateDraft(
        userId,
        draftId,
        request.body,
      );
      return successResponse(reply, result, "Draft updated");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async deleteDraft(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: draftId } = request.params;
      const result = await businessService.deleteDraft(userId, draftId);
      return successResponse(reply, { deletion: result }, "Draft deleted");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async submitDraft(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: draftId } = request.params;

      const result = await businessService.submitDraft(userId, draftId);
      return successResponse(reply, result, "Draft submitted", 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  async createTemplate(
    request: FastifyRequest<{ Body: TemplateCreateRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const result = await businessService.createTemplate(userId, request.body);
      return successResponse(reply, result, "Template created", 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async getTemplate(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: templateId } = request.params;

      const result = await businessService.getTemplate(userId, templateId);
      return successResponse(reply, result, "Template retrieved");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async listTemplates(
    request: FastifyRequest<{ Querystring: ListTemplatesQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { page = 1, limit = 20, isActive = true } = request.query;

      const result = await businessService.listTemplates(
        userId,
        page,
        limit,
        isActive,
      );
      return successResponse(reply, result, "Templates retrieved");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async updateTemplate(
    request: FastifyRequest<{ Params: IdParam; Body: TemplateUpdateRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: templateId } = request.params;

      const result = await businessService.updateTemplate(
        userId,
        templateId,
        request.body,
      );
      return successResponse(reply, result, "Template updated");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async deleteTemplate(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: templateId } = request.params;

      const result = await businessService.deleteTemplate(userId, templateId);
      return successResponse(reply, { deletion: result }, "Template deleted");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async createDraftFromTemplate(
    request: FastifyRequest<{ Params: IdParam }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const { id: templateId } = request.params;

      const result = await businessService.createDraftFromTemplate(
        userId,
        templateId,
      );
      return successResponse(reply, result, "Draft created from template", 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  // =========================================================================
  // ORDERS
  // =========================================================================

  async bulkCreateOrders(
    request: FastifyRequest<{ Body: BulkOrderCreateRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const result = await businessService.bulkCreateOrders(
        userId,
        request.body,
      );
      return successResponse(
        reply,
        result,
        "Bulk order creation processed",
        201,
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async exportOrders(
    request: FastifyRequest<{ Querystring: ExportOrdersQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;

      reply.header("Content-Type", "text/csv");
      const dateStr = new Date().toISOString().split("T")[0];
      reply.header(
        "Content-Disposition",
        `attachment; filename="orders-${dateStr}.csv"`,
      );

      await businessService.exportOrdersToCsvStream(
        userId,
        request.query,
        reply.raw,
      );

      if (!reply.raw.writableEnded) {
        reply.raw.end();
      }

      return reply;
    } catch (error) {
      logger.error({
        msg: "GET /api/v1/business/orders/export",
        requestId: request.id,
        error: (error as Error).message,
      });

      if (!reply.raw.writableEnded) {
        reply.raw.end();
      }

      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  async bulkCancelOrders(
    request: FastifyRequest<{ Body: BulkCancelRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const {
        orders: { ids, reason },
      } = request.body;

      const result = await businessService.bulkCancelOrders(
        userId,
        ids,
        reason,
      );

      logger.info({
        msg: "POST /api/v1/business/orders/bulk-cancel",
        statusCode: 200,
        userId,
        requested: result.bulk.requested,
        cancelled: result.bulk.cancelled,
        failed: result.bulk.failed,
      });

      return successResponse(reply, result, "Bulk cancel processed");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  async getAnalytics(
    request: FastifyRequest<{ Querystring: AnalyticsQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = request.user!;
      const data = await businessService.getAnalytics(userId, request.query);
      return successResponse(reply, data, "Analytics retrieved");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new BusinessController();
