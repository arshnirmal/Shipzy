import businessRepository from "./business.repository.js";
import ordersService from "../orders/orders.service.js";
import ordersRepository from "../orders/orders.repository.js";
import { CreateOrderRequestZ, OrderCreateResultZ } from "../orders/orders.zod.js";
import {
  AppError,
  NotFoundError,
  ValidationError,
  AuthorizationError,
} from "../../utils/error.util.js";
import { rawTransaction } from "../../database/transaction.js";
import ordersQueries from "../../database/queries/orders.queries.js";
import type {
  DraftCreateRequest,
  DraftUpdateRequest,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  BulkOrderCreateRequest,
} from "./business.zod.js";

const PAGE_LIMIT = 10000;

class BusinessService {
  private deduceDraftState(draft: any) {
    if (draft.submittedAt) return "submitted";
    const requiredFields = [
      "fulfillment",
      "pickupLocation",
      "deliveryLocation",
    ];
    if (requiredFields.every((field) => draft[field])) {
      // Technically needs to pass CreateOrderRequestZ, but keeping simple for now
      return "ready";
    }
    return "incomplete";
  }

  private toDraftResponse(draft: any) {
    return {
      draftId: draft.draftId,
      draftUuid: draft.draftUuid,
      name: draft.name,
      state: this.deduceDraftState(draft),
      fulfillment: draft.fulfillment,
      pickupLocation: draft.pickupLocation,
      deliveryLocation: draft.deliveryLocation,
      items: draft.items || [],
      package: draft.package,
      schedule: draft.schedule ?? null,
      pricing: draft.pricing,
      couponCode: draft.couponCode,
      notes: draft.notes,
      templateId: draft.templateId,
      submittedOrderId: draft.submittedOrderId,
      submittedAt: draft.submittedAt ? draft.submittedAt.toISOString() : null,
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    };
  }

  private toTemplateResponse(template: any) {
    return {
      templateId: template.templateId,
      templateUuid: template.templateUuid,
      name: template.name,
      description: template.description,
      fulfillment: template.fulfillment,
      pickupLocation: template.pickupLocation,
      deliveryLocation: template.deliveryLocation,
      items: template.items || [],
      package: template.package,
      useCount: template.useCount,
      isActive: template.isActive,
      createdAt: template.createdAt.toISOString(),
      updatedAt: template.updatedAt.toISOString(),
    };
  }

  // =========================================================================
  // DRAFTS
  // =========================================================================

  async createDraft(clientId: number, data: DraftCreateRequest) {
    const draft = await businessRepository.createDraft(clientId, data);
    return this.toDraftResponse(draft);
  }

  async getDraft(clientId: number, draftId: number) {
    const draft = await businessRepository.getDraftById(draftId);
    if (!draft) throw new NotFoundError("Draft not found");
    if (draft.clientId !== clientId) throw new AuthorizationError("Access denied");
    return this.toDraftResponse(draft);
  }

  async listDrafts(
    clientId: number,
    page: number,
    limit: number,
    stateFilter?: string,
  ) {
    const offset = (page - 1) * limit;

    if (stateFilter === "submitted") {
      // DB-level filter — accurate pagination
      const { drafts, total } = await businessRepository.getDraftsByClient(
        clientId, limit, offset, true,
      );
      return {
        drafts: drafts.map((d) => this.toDraftResponse(d)),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    if (stateFilter === "incomplete" || stateFilter === "ready") {
      // Fetch all non-submitted drafts, compute state in memory, then slice
      const { drafts } = await businessRepository.getDraftsByClient(
        clientId, 0, 0, false, true,
      );
      const filtered = drafts
        .map((d) => this.toDraftResponse(d))
        .filter((d) => d.state === stateFilter);
      const total = filtered.length;
      return {
        drafts: filtered.slice(offset, offset + limit),
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }

    // No filter — standard DB pagination
    const { drafts, total } = await businessRepository.getDraftsByClient(
      clientId, limit, offset,
    );
    return {
      drafts: drafts.map((d) => this.toDraftResponse(d)),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateDraft(
    clientId: number,
    draftId: number,
    data: DraftUpdateRequest,
  ) {
    const draft = await businessRepository.getDraftById(draftId);
    if (!draft) throw new NotFoundError("Draft not found");
    if (draft.clientId !== clientId) throw new AuthorizationError("Access denied");
    if (draft.submittedAt)
      throw new AppError("Cannot update a submitted draft", 409);

    const updated = await businessRepository.updateDraft(draftId, data);
    return this.toDraftResponse(updated);
  }

  async deleteDraft(clientId: number, draftId: number) {
    const draft = await businessRepository.getDraftById(draftId);
    if (!draft) throw new NotFoundError("Draft not found");
    if (draft.clientId !== clientId) throw new AuthorizationError("Access denied");
    if (draft.submittedAt)
      throw new AppError("Cannot delete a submitted draft", 409);

    await businessRepository.softDeleteDraft(draftId);
    return { success: true };
  }

  async submitDraft(clientId: number, draftId: number) {
    const draft = await businessRepository.getDraftById(draftId);
    if (!draft) throw new NotFoundError("Draft not found");
    if (draft.clientId !== clientId) throw new AuthorizationError("Access denied");
    if (draft.submittedAt)
      throw new AppError("Draft is already submitted", 409);

    // Validate if it is fully ready
    if (
      !draft.fulfillment ||
      !draft.pickupLocation ||
      !draft.deliveryLocation ||
      !draft.pricing
    ) {
      throw new ValidationError(
        "Draft is missing required fields (fulfillment, locations, or pricing)",
      );
    }

    const orderPayload = {
      fulfillment: draft.fulfillment as any,
      locations: {
        pickup: draft.pickupLocation as any,
        delivery: draft.deliveryLocation as any,
      },
      package: draft.package || { notifyRecipientSms: false },
      pricing: draft.pricing as any,
      couponCode: draft.couponCode || null,
      items: draft.items as any,
      schedule: (draft.schedule as any) ?? {},
    };

    const parsedOrder = CreateOrderRequestZ.safeParse(orderPayload);
    if (!parsedOrder.success) {
      throw new ValidationError(
        "Draft payload validation failed: " + parsedOrder.error.message,
      );
    }

    // Atomic: create order + mark draft submitted in a single transaction.
    // If the draft update fails the order is rolled back, preventing duplicate orders on retry.
    return rawTransaction(async (client) => {
      const orderResult = await client.query(ordersQueries.CALL_CREATE_ORDER, [
        JSON.stringify({ clientId, ...parsedOrder.data }),
      ]);
      const raw = orderResult.rows[0]?.result;
      const parsed = OrderCreateResultZ.parse(raw);
      if (!parsed.success || !parsed.order) {
        throw new AppError(parsed.error || "Order creation failed", 400);
      }
      const orderId = parsed.order.identifiers.orderId;

      await client.query(
        `UPDATE orders.drafts
            SET submitted_order_id = $1, submitted_at = NOW(), updated_at = NOW()
          WHERE draft_id = $2`,
        [orderId, draftId],
      );

      return { order: parsed.order };
    });
  }

  // =========================================================================
  // TEMPLATES
  // =========================================================================

  async createTemplate(clientId: number, data: TemplateCreateRequest) {
    const template = await businessRepository.createTemplate(clientId, data);
    return this.toTemplateResponse(template);
  }

  async getTemplate(clientId: number, templateId: number) {
    const template = await businessRepository.getTemplateById(templateId);
    if (!template) throw new NotFoundError("Template not found");
    if (template.clientId !== clientId) throw new AuthorizationError("Access denied");
    return this.toTemplateResponse(template);
  }

  async listTemplates(
    clientId: number,
    page: number,
    limit: number,
    isActive: boolean,
  ) {
    const offset = (page - 1) * limit;
    const { templates, total } = await businessRepository.getTemplatesByClient(
      clientId,
      limit,
      offset,
      isActive,
    );
    return {
      templates: templates.map((t) => this.toTemplateResponse(t)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateTemplate(
    clientId: number,
    templateId: number,
    data: TemplateUpdateRequest,
  ) {
    const template = await businessRepository.getTemplateById(templateId);
    if (!template) throw new NotFoundError("Template not found");
    if (template.clientId !== clientId) throw new AuthorizationError("Access denied");

    const updated = await businessRepository.updateTemplate(templateId, data);
    return this.toTemplateResponse(updated);
  }

  async deleteTemplate(clientId: number, templateId: number) {
    const template = await businessRepository.getTemplateById(templateId);
    if (!template) throw new NotFoundError("Template not found");
    if (template.clientId !== clientId) throw new AuthorizationError("Access denied");

    await businessRepository.softDeleteTemplate(templateId);
    return { success: true };
  }

  async createDraftFromTemplate(clientId: number, templateId: number) {
    const template = await businessRepository.getTemplateById(templateId);
    if (!template) throw new NotFoundError("Template not found");
    if (template.clientId !== clientId) throw new AuthorizationError("Access denied");

    const draftData = {
      name: `Copy of ${template.name}`,
      fulfillment: template.fulfillment,
      pickupLocation: template.pickupLocation,
      deliveryLocation: template.deliveryLocation,
      items: template.items,
      package: template.package,
      templateId: template.templateId,
    };

    const draft = await businessRepository.createDraft(clientId, draftData);
    await businessRepository.incrementTemplateUseCount(templateId);

    return this.toDraftResponse(draft);
  }

  // =========================================================================
  // BULK ORDERS
  // =========================================================================

  async bulkCreateOrders(clientId: number, requests: BulkOrderCreateRequest) {
    const results = [];
    let created = 0;
    let failed = 0;

    for (let i = 0; i < requests.orders.length; i++) {
      try {
        const parsed = CreateOrderRequestZ.parse(requests.orders[i]);
        const response = await ordersService.createOrder(clientId, parsed);
        results.push({
          index: i,
          success: true,
          orderId: response.order.identifiers.orderId,
        });
        created++;
      } catch (err: any) {
        results.push({
          index: i,
          success: false,
          error: err.message || "Failed to create order",
        });
        failed++;
      }
    }

    return {
      bulk: {
        requested: requests.orders.length,
        created,
        failed,
        results,
      },
    };
  }

  // =========================================================================
  // EXPORTS
  // =========================================================================

  async exportOrdersToCsvStream(
    clientId: number,
    queryParams: any,
    stream: any,
  ) {
    const { total: totalCount } = await ordersRepository.findByClient(
      clientId, 1, 0,
      queryParams.status,
      queryParams.dateFrom,
      queryParams.dateTo,
    );
    if (totalCount > PAGE_LIMIT) {
      throw new AppError(
        `Export exceeds ${PAGE_LIMIT.toLocaleString()} rows. Please narrow your date range.`,
        400,
      );
    }

    const limit = 1000;
    let offset = 0;
    let totalExported = 0;

    const writeRow = (row: any[]) => {
      const line =
        row
          .map((col) => {
            if (col == null) return "";
            const str = String(col).replace(/"/g, '""');
            return `"${str}"`;
          })
          .join(",") + "\n";
      stream.write(line);
    };

    // Output headers
    writeRow([
      "Order Number",
      "Status",
      "Pickup Address",
      "Delivery Address",
      "Vehicle",
      "Package Type",
      "Total (₹)",
      "Created At",
      "Delivered At",
    ]);

    while (true) {
      if (totalExported >= PAGE_LIMIT) break; // Safety cap

      const result = await ordersRepository.findByClient(
        clientId,
        limit,
        offset,
        queryParams.status,
        queryParams.dateFrom,
        queryParams.dateTo,
      );

      const ordersChunk = result.orders;
      if (ordersChunk.length === 0) break;

      for (const order of ordersChunk) {
        writeRow([
          order.orderNumber || order.orderUuid.slice(0, 8),
          order.status,
          order.pickup?.fullAddress || "",
          order.delivery?.fullAddress || "",
          (order as any).snapshot?.vehicleCategory?.name || order.vehicleCategoryId || "",
          (order as any).snapshot?.packageType?.name || order.packageTypeId || "N/A",
          order.totalPrice || 0,
          order.createdAt.toISOString(),
          order.deliveredAt ? order.deliveredAt.toISOString() : "",
        ]);
        totalExported++;
        if (totalExported >= PAGE_LIMIT) break;
      }

      offset += limit;
    }
  }

  // =========================================================================
  // ANALYTICS
  // =========================================================================

  async getAnalytics(clientId: number, queryParams: any) {
    const fromDate = new Date(queryParams.dateFrom);
    const toDate = new Date(queryParams.dateTo);
    
    if (fromDate >= toDate) {
      throw new AppError("dateFrom must be before dateTo", 400);
    }
    const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 3600 * 24);
    if (daysDiff > 366) {
      throw new AppError("Analytics date range cannot exceed 366 days", 400);
    }
    
    const row = await businessRepository.getBusinessAnalytics(clientId, fromDate, toDate);
    
    const total = parseInt(row.total || "0", 10);
    const delivered = parseInt(row.delivered || "0", 10);
    const cancelled = parseInt(row.cancelled || "0", 10);
    const active = parseInt(row.active || "0", 10);
    
    const denom = delivered + cancelled;
    const successRate = denom > 0 ? (delivered / denom) * 100 : 0;
    
    const spendTotal = parseFloat(row.spend_total || "0");
    const spendAverage = parseFloat(row.spend_average || "0");
    const avgDuration = parseFloat(row.avg_duration || "0");

    return {
      analytics: {
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString()
        },
        orders: {
          total,
          delivered,
          cancelled,
          active,
          successRate: Number(successRate.toFixed(1))
        },
        spend: {
          total: Number(spendTotal.toFixed(2)),
          average: Number(spendAverage.toFixed(2)),
          currency: "INR"
        },
        delivery: {
          avgDurationMins: Math.round(avgDuration)
        }
      }
    };
  }
}

export default new BusinessService();
