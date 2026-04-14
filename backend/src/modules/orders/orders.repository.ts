// services/backend/src/modules/orders/orders.repository.ts
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import { drizzlePool } from "../../database/drizzle.js";
import ordersQueries from "../../database/queries/orders.queries.js";
import { orderRequests } from "../../database/schema/orders.js";
import {
  AcceptOrderResultZ,
  CancelOrderResultZ,
  FareCalculationResultZ,
  OrderCreateResultZ,
} from "./orders.zod.js";
import { AppError, NotFoundError, ValidationError } from "../../utils/error.util.js";
import type { FareCalculationResult, OrderCreateResult } from "./orders.zod.js";
import type {
  AcceptOrderResult,
  CancelOrderResult,
  OrderRow,
  OrderListRow,
  AvailableOrderRow,
  CreateOrderPayload,
} from "./orders.zod.js";

// Whitelist of sortable columns to prevent SQL injection
const SORT_COLUMN_WHITELIST: Record<string, string> = {
  createdAt: "o.created_at",
  totalPrice: "o.total_price",
  deliveredAt: "o.delivered_at",
  pickedUpAt: "o.picked_up_at",
};

class OrdersRepository {
  /**
   * Calculate fare using stored function
   */
  async calculateFare(
    deliveryTypeId: number,
    vehicleCategoryId: number,
    distanceKm: number,
    weightTierId: number,
    packageTypeId?: number,
  ): Promise<FareCalculationResult> {
    try {
      const result = await drizzlePool.query(
        ordersQueries.CALL_CALCULATE_FARE,
        [
          deliveryTypeId,
          vehicleCategoryId,
          distanceKm,
          weightTierId,
          packageTypeId ?? null,
        ],
      );

      const rawResult = result.rows[0]?.result as Record<string, unknown>;
      const mappedResult = {
        success: Boolean(rawResult?.success),
        pricing: rawResult?.pricing,
        error: rawResult?.error,
      };

      return FareCalculationResultZ.parse(mappedResult);
    } catch (error) {
      logger.error({
        msg: "Error calculating fare",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create order using stored function
   */
  async createOrder(orderData: CreateOrderPayload): Promise<OrderCreateResult> {
    try {
      const result = await drizzlePool.query(ordersQueries.CALL_CREATE_ORDER, [
        JSON.stringify(orderData),
      ]);

      const rawResult = result.rows[0]?.result;
      return OrderCreateResultZ.parse(rawResult);
    } catch (error) {
      logger.error({
        msg: "Error creating order",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find order by ID
   */
  async findById(orderId: number): Promise<OrderRow | null> {
    try {
      const result = await drizzlePool.query(ordersQueries.FIND_ORDER_BY_ID, [
        orderId,
      ]);
      return (result.rows[0] as OrderRow) || null;
    } catch (error) {
      logger.error({
        msg: "Error finding order by ID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find orders by client with pagination, filtering, and sorting
   */
  async findByClient(
    clientId: number,
    limit: number,
    offset: number,
    status?: string,
    dateFrom?: string,
    dateTo?: string,
    sortBy?: string,
    sortOrder: "asc" | "desc" = "desc",
    search?: string,
    deliveryTypeId?: number,
    minPrice?: number,
    maxPrice?: number,
  ): Promise<{ orders: OrderListRow[]; total: number }> {
    try {
      const sortCol = SORT_COLUMN_WHITELIST[sortBy ?? ""] ?? "o.created_at";
      const sortDir = sortOrder === "asc" ? "ASC" : "DESC";

      // Build status WHERE clause
      let statusWhere = "";
      if (status === "active") {
        statusWhere = `AND o.status IN ('pending', 'accepted', 'picked_up', 'in_transit')`;
      } else if (status === "completed") {
        statusWhere = `AND o.status = 'delivered'`;
      } else if (status === "cancelled") {
        statusWhere = `AND o.status = 'cancelled'`;
      }

      // Build parameterized filter conditions
      const queryParams: Array<number | string> = [clientId];
      const filterConditions: string[] = [];

      if (dateFrom) {
        queryParams.push(dateFrom);
        filterConditions.push(`o.created_at >= $${queryParams.length}`);
      }
      if (dateTo) {
        queryParams.push(dateTo);
        filterConditions.push(`o.created_at <= $${queryParams.length}`);
      }
      if (search) {
        const pattern = `%${search}%`;
        queryParams.push(pattern);
        const idx = queryParams.length;
        filterConditions.push(
          `(o.order_number ILIKE $${idx} OR o.delivery_location->>'contactName' ILIKE $${idx} OR o.delivery_location->>'fullAddress' ILIKE $${idx})`,
        );
      }
      if (deliveryTypeId != null) {
        queryParams.push(deliveryTypeId);
        filterConditions.push(`o.delivery_type_id = $${queryParams.length}`);
      }
      if (minPrice != null) {
        queryParams.push(minPrice);
        filterConditions.push(`o.total_price >= $${queryParams.length}`);
      }
      if (maxPrice != null) {
        queryParams.push(maxPrice);
        filterConditions.push(`o.total_price <= $${queryParams.length}`);
      }

      const filterWhere = filterConditions.length
        ? `AND ${filterConditions.join(" AND ")}`
        : "";
      const countParams = [...queryParams];

      const limitIndex = queryParams.length + 1;
      const offsetIndex = queryParams.length + 2;
      queryParams.push(limit, offset);

      const selectFields = `
        o.order_id             AS "orderId",
        o.order_uuid           AS "orderUuid",
        o.order_number         AS "orderNumber",
        o.status               AS "status",
        o.delivery_type_id     AS "deliveryTypeId",
        o.vehicle_category_id  AS "vehicleCategoryId",
        o.weight_tier_id       AS "weightTierId",
        o.package_type_id      AS "packageTypeId",
        o.payment_method_id    AS "paymentMethodId",
        o.estimated_distance_km AS "estimatedDistanceKm",
        o.actual_distance_km   AS "actualDistanceKm",
        o.total_price          AS "totalPrice",
        o.created_at           AS "createdAt",
        o.accepted_at          AS "acceptedAt",
        o.picked_up_at         AS "pickedUpAt",
        o.in_transit_at        AS "inTransitAt",
        o.delivered_at         AS "deliveredAt",
        o.cancelled_at         AS "cancelledAt",
        o.pickup_location      AS "pickup",
        o.delivery_location    AS "delivery",
        o.package              AS "package",
        o.pricing              AS "pricing",
        o.snapshot             AS "snapshot",
        ca.courier_id          AS "courierId",
        cu.full_name           AS "courierName",
        cu.phone_number        AS "courierPhone",
        cu.profile_picture_url AS "courierPhoto"
      `;

      const fromJoins = `
        FROM orders.requests o
        LEFT JOIN orders.courier_assignments ca ON o.order_id = ca.order_id
        LEFT JOIN users.profiles cu ON ca.courier_id = cu.user_id
      `;

      const whereClause = `
        WHERE o.client_id = $1
          AND o.deleted_at IS NULL
          ${statusWhere}
          ${filterWhere}
      `;

      const ordersQuery = `
        SELECT ${selectFields}
        ${fromJoins}
        ${whereClause}
        ORDER BY ${sortCol} ${sortDir}
        LIMIT $${limitIndex} OFFSET $${offsetIndex}
      `;

      const countQuery = `
        SELECT COUNT(*) AS total
        FROM orders.requests o
        ${whereClause}
      `;

      const [ordersResult, countResult] = await Promise.all([
        drizzlePool.query(ordersQuery, queryParams),
        drizzlePool.query(countQuery, countParams),
      ]);

      return {
        orders: ordersResult.rows as OrderListRow[],
        total: Number.parseInt(countResult.rows[0].total, 10),
      };
    } catch (error) {
      logger.error({
        msg: "Error finding orders by client",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find available orders for courier
   */
  async findAvailableOrders(
    latitude: number,
    longitude: number,
    radiusKm: number,
    limit: number,
  ): Promise<AvailableOrderRow[]> {
    try {
      const result = await drizzlePool.query(
        ordersQueries.FIND_AVAILABLE_ORDERS_FOR_COURIER,
        [longitude, latitude, radiusKm, limit],
      );

      return result.rows as AvailableOrderRow[];
    } catch (error) {
      logger.error({
        msg: "Error finding available orders",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Cancel order using stored function
   */
  async cancelOrder(
    orderId: number,
    cancellationReason: string,
    cancelledByUserId: number,
  ): Promise<CancelOrderResult> {
    try {
      const result = await drizzlePool.query(
        ordersQueries.CALL_CANCEL_ORDER_WITH_REFUND,
        [orderId, cancellationReason, cancelledByUserId],
      );

      const raw = result.rows[0]?.result as Record<string, unknown> | undefined;
      if (!raw?.success) {
        throw new ValidationError(
          String(raw?.error ?? "Unable to cancel order"),
        );
      }

      return CancelOrderResultZ.parse({
        order: raw.order,
        refund: raw.refund,
      });
    } catch (error) {
      logger.error({
        msg: "Error cancelling order",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Accept order (driver accepts) - using proper transaction
   */
  async acceptOrder(
    orderId: number,
    courierId: number,
  ): Promise<AcceptOrderResult> {
    try {
      const result = await drizzlePool.query(
        ordersQueries.CALL_ASSIGN_ORDER_TO_COURIER,
        [orderId, courierId],
      );

      const parsed = result.rows[0]?.result as Record<string, unknown>;
      if (!parsed?.success) {
        throw new ValidationError(
          String(parsed?.error ?? "Unable to accept order"),
        );
      }

      return AcceptOrderResultZ.parse({
        assignment: parsed.assignment,
        order: parsed.order,
      });
    } catch (error) {
      logger.error({
        msg: "Error accepting order",
        error: (error as Error).message,
        orderId,
        courierId,
      });
      throw error;
    }
  }

  /**
   * Record a status transition in orders.status_history
   */
  async recordStatusHistory(
    orderId: number,
    status: string,
    previousStatus: string | null,
    changedBy: number | null,
    notes?: string,
  ): Promise<void> {
    try {
      await drizzlePool.query(ordersQueries.INSERT_STATUS_HISTORY, [
        orderId,
        status,
        previousStatus,
        changedBy,
        notes ?? null,
      ]);
    } catch (error) {
      logger.error({
        msg: "Error recording status history",
        error: (error as Error).message,
        orderId,
        status,
      });
      throw error;
    }
  }

  /**
   * Update order status (picked_up / in_transit / delivered) - Drizzle ORM
   */
  async updateOrderStatus(orderId: number, status: string) {
    try {
      const validStatuses = new Set([
        "picked_up",
        "in_transit",
        "delivered",
      ] as const);
      if (
        !validStatuses.has(status as "picked_up" | "in_transit" | "delivered")
      ) {
        throw new ValidationError(`Invalid status: ${status}`);
      }
      const updateData: Partial<typeof orderRequests.$inferInsert> = {
        status: status as "picked_up" | "in_transit" | "delivered",
        updatedAt: new Date(),
      };

      if (status === "picked_up") {
        updateData.pickedUpAt = new Date();
      } else if (status === "in_transit") {
        updateData.inTransitAt = new Date();
      } else if (status === "delivered") {
        updateData.deliveredAt = new Date();
      }

      const result = await drizzleDb
        .update(orderRequests)
        .set(updateData)
        .where(eq(orderRequests.orderId, orderId))
        .returning();

      if (!result || result.length === 0) {
        throw new NotFoundError(`Order not found or update failed: ${orderId}`);
      }

      return result[0];
    } catch (error) {
      logger.error({
        msg: "Error updating order status",
        error: (error as Error).message,
        orderId,
        status,
      });
      throw error;
    }
  }

  async getVolumeDiscount(clientId: number): Promise<{discountPct?: number}> {
    try {
      const userRes = await drizzlePool.query(`SELECT role FROM users.profiles WHERE user_id = $1 LIMIT 1`, [clientId]);
      if (userRes.rows[0]?.role !== "business") return {};

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const countRes = await drizzlePool.query(`
        SELECT COUNT(*) as cnt FROM orders.requests 
        WHERE client_id = $1 
        AND created_at >= $2 
        AND deleted_at IS NULL
        AND status IN ('pending', 'scheduled', 'accepted', 'picked_up', 'in_transit', 'delivered')
      `, [clientId, thirtyDaysAgo]);
      
      const count = parseInt(countRes.rows[0].cnt, 10);
      
      const tierRes = await drizzlePool.query(`
        SELECT discount_pct FROM public.business_discount_tiers
        WHERE min_orders <= $1 
        AND (max_orders >= $1 OR max_orders IS NULL)
        AND is_active = true
        LIMIT 1
      `, [count]);
      
      if (tierRes.rows.length === 0) return {};
      return { discountPct: parseFloat(tierRes.rows[0].discount_pct) };
    } catch (err) {
      logger.error({ msg: "Error fetching volume discount", error: (err as Error).message });
      return {};
    }
  }

  async releaseScheduledOrders(): Promise<number[]> {
    const result = await drizzlePool.query(`
      UPDATE orders.requests
      SET status = 'pending', updated_at = NOW()
      WHERE status = 'scheduled'
      AND (schedule->>'pickupAt')::timestamptz <= NOW() + interval '30 minutes'
      AND deleted_at IS NULL
      RETURNING order_id;
    `);
    return result.rows.map(r => r.order_id);
  }

  /**
   * Atomically deliver order and release courier via stored function
   */
  async deliverOrder(
    orderId: number,
    courierId: number,
  ): Promise<{ orderId: number; status: string; deliveredAt: string }> {
    try {
      const result = await drizzlePool.query(ordersQueries.CALL_DELIVER_ORDER, [
        orderId,
        courierId,
      ]);
      const json = result.rows[0]?.result as {
        success: boolean;
        error?: string;
        order?: { orderId: number; status: string; deliveredAt: string };
      };
      if (!json?.success) {
        throw new AppError(json?.error ?? "Delivery failed", 500);
      }
      return json.order!;
    } catch (error) {
      logger.error({
        msg: "Error delivering order",
        error: (error as Error).message,
        orderId,
        courierId,
      });
      throw error;
    }
  }

  /**
   * Bulk cancel orders for a client/business user
   */
  async bulkCancelOrders(
    orderIds: number[],
    userId: number,
    reason: string,
  ): Promise<{
    requested: number;
    cancelled: number;
    failed: number;
    results: { orderId: number; success: boolean; error?: string }[];
  }> {
    const results: { orderId: number; success: boolean; error?: string }[] = [];

    await Promise.all(
      orderIds.map(async (orderId) => {
        try {
          const result = await drizzlePool.query(
            ordersQueries.CALL_CANCEL_ORDER_WITH_REFUND,
            [orderId, reason, userId],
          );
          const raw = result.rows[0]?.result as
            | Record<string, unknown>
            | undefined;
          if (!raw?.success) {
            results.push({
              orderId,
              success: false,
              error: String(raw?.error ?? "Cannot cancel order"),
            });
          } else {
            results.push({ orderId, success: true });
          }
        } catch (err) {
          results.push({
            orderId,
            success: false,
            error: (err as Error).message,
          });
        }
      }),
    );

    const cancelled = results.filter((r) => r.success).length;
    return {
      requested: orderIds.length,
      cancelled,
      failed: orderIds.length - cancelled,
      results,
    };
  }
}

export default new OrdersRepository();
