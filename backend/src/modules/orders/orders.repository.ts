// services/backend/src/modules/orders/orders.repository.ts
import { eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import { drizzlePool } from "../../database/drizzle.js";
import { rawTransaction } from "../../database/transaction.js";
import ordersQueries from "../../database/queries/orders.queries.js";
import { orderRequests } from "../../database/schema/orders.js";
import { FareCalculationResultZ, OrderCreateResultZ } from "./orders.zod.js";
import { toIsoDateTime } from "../../utils/datetime.util.js";
import type {
  FareCalculationResult,
  OrderCreateResult,
} from "../../types/orders.js";
import type {
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

      const rawResult = result.rows[0]?.result as any;
      const mappedResult = {
        success: Boolean(rawResult?.success),
        fareBreakdown: rawResult?.fare_breakdown ?? rawResult?.fareBreakdown,
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
  async createOrder(
    orderData: CreateOrderPayload,
  ): Promise<OrderCreateResult> {
    try {
      const result = await drizzlePool.query(ordersQueries.CALL_CREATE_ORDER, [
        JSON.stringify(orderData),
      ]);

      const rawResult = result.rows[0]?.result as any;
      if (rawResult?.order?.createdAt != null) {
        rawResult.order.createdAt = toIsoDateTime(rawResult.order.createdAt);
      }
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

      // Build date WHERE clauses with parameterized placeholders
      const queryParams: any[] = [clientId];
      const dateConditions: string[] = [];

      if (dateFrom) {
        queryParams.push(dateFrom);
        dateConditions.push(`o.created_at >= $${queryParams.length}`);
      }
      if (dateTo) {
        queryParams.push(dateTo);
        dateConditions.push(`o.created_at <= $${queryParams.length}`);
      }

      const dateWhere = dateConditions.length
        ? `AND ${dateConditions.join(" AND ")}`
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
        o.estimated_distance_km AS "estimatedDistanceKm",
        o.actual_distance_km   AS "actualDistanceKm",
        o.total_price          AS "totalPrice",
        o.created_at           AS "createdAt",
        o.accepted_at          AS "acceptedAt",
        o.picked_up_at         AS "pickedUpAt",
        o.delivered_at         AS "deliveredAt",
        o.pickup_location      AS "pickup",
        o.delivery_location    AS "delivery",
        o.pricing              AS "pricing",
        o.snapshot             AS "snapshot",
        ca.courier_id          AS "courierId",
        cu.full_name           AS "courierName",
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
          ${dateWhere}
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
  ) {
    try {
      const result = await drizzlePool.query(
        ordersQueries.CALL_CANCEL_ORDER_WITH_REFUND,
        [orderId, cancellationReason, cancelledByUserId],
      );

      return result.rows[0]?.result ?? null;
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
  async acceptOrder(orderId: number, courierId: number) {
    return await rawTransaction(async (client) => {
      try {
        // Create assignment
        const assignmentResult = await client.query(
          ordersQueries.CREATE_COURIER_ASSIGNMENT,
          [orderId, courierId],
        );

        // Update assignment to accepted
        await client.query(ordersQueries.ACCEPT_ASSIGNMENT, [
          orderId,
          courierId,
        ]);

        // Update order status to assigned
        await client.query(ordersQueries.UPDATE_ORDER_STATUS_TO_ASSIGNED, [
          orderId,
        ]);

        // Update courier status
        await client.query(ordersQueries.UPDATE_COURIER_CURRENT_ASSIGNMENT, [
          courierId,
          assignmentResult.rows[0].assignment_id,
        ]);

        return assignmentResult.rows[0];
      } catch (error) {
        logger.error({
          msg: "Error in acceptOrder transaction",
          error: (error as Error).message,
          orderId,
          courierId,
        });
        throw error;
      }
    });
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
      const validStatuses = new Set(["picked_up", "in_transit", "delivered"] as const);
      if (!validStatuses.has(status as "picked_up" | "in_transit" | "delivered")) {
        throw new Error(`Invalid status: ${status}`);
      }
      const updateData: any = {
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
        throw new Error(`Order not found or update failed: ${orderId}`);
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
}

export default new OrdersRepository();
