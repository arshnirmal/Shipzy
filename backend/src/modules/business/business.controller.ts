import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import businessService from "./business.service.js";
import type { BulkCancelRequest } from "../orders/orders.zod.js";

class BusinessController {
  // =========================================================================
  // DRAFTS
  // =========================================================================

  async createDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = request.body as any;
    const result = await businessService.createDraft(userId, body);
    return reply.status(201).send(result);
  }

  async getDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: draftId } = request.params as any;
    const result = await businessService.getDraft(userId, Number(draftId));
    return reply.status(200).send(result);
  }

  async listDrafts(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = request.query as any;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const state = query.state as string | undefined;

    const result = await businessService.listDrafts(userId, page, limit, state);
    return reply.status(200).send(result);
  }

  async updateDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: draftId } = request.params as any;
    const body = request.body as any;

    const result = await businessService.updateDraft(
      userId,
      Number(draftId),
      body,
    );
    return reply.status(200).send(result);
  }

  async deleteDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: draftId } = request.params as any;

    await businessService.deleteDraft(userId, Number(draftId));
    return reply.status(204).send();
  }

  async submitDraft(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: draftId } = request.params as any;

    const result = await businessService.submitDraft(userId, Number(draftId));
    return reply.status(201).send(result);
  }

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  async createTemplate(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = request.body as any;

    const result = await businessService.createTemplate(userId, body);
    return reply.status(201).send(result);
  }

  async getTemplate(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: templateId } = request.params as any;

    const result = await businessService.getTemplate(
      userId,
      Number(templateId),
    );
    return reply.status(200).send(result);
  }

  async listTemplates(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = request.query as any;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    // default true
    const isActive =
      query.isActive !== undefined
        ? query.isActive !== "false" && query.isActive !== false
        : true;

    const result = await businessService.listTemplates(
      userId,
      page,
      limit,
      isActive,
    );
    return reply.status(200).send(result);
  }

  async updateTemplate(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: templateId } = request.params as any;
    const body = request.body as any;

    const result = await businessService.updateTemplate(
      userId,
      Number(templateId),
      body,
    );
    return reply.status(200).send(result);
  }

  async deleteTemplate(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: templateId } = request.params as any;

    await businessService.deleteTemplate(userId, Number(templateId));
    return reply.status(204).send();
  }

  async createDraftFromTemplate(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const { id: templateId } = request.params as any;

    const result = await businessService.createDraftFromTemplate(
      userId,
      Number(templateId),
    );
    return reply.status(201).send(result);
  }

  // =========================================================================
  // ORDERS
  // =========================================================================

  async bulkCreateOrders(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const body = request.body as any;
    const result = await businessService.bulkCreateOrders(userId, body);
    return reply.status(201).send(result);
  }

  async exportOrders(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = request.query as any;

    reply.header("Content-Type", "text/csv");
    const dateStr = new Date().toISOString().split("T")[0];
    reply.header(
      "Content-Disposition",
      `attachment; filename="orders-${dateStr}.csv"`,
    );

    try {
      await businessService.exportOrdersToCsvStream(userId, query, reply.raw);
    } catch (err) {
      request.log.error(err);
    } finally {
      reply.raw.end();
    }

    return reply;
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

  async getAnalytics(request: FastifyRequest, reply: FastifyReply) {
    const userId = request.user!.userId;
    const query = request.query as any;

    const data = await businessService.getAnalytics(userId, query);

    return {
      success: true,
      message: "Analytics retrieved",
      data,
      timestamp: new Date().toISOString(),
    };
  }
}

export default new BusinessController();
