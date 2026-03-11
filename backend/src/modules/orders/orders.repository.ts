// services/backend/src/modules/orders/orders.repository.ts
import { eq, sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import db from "../../database/db.js";
import { rawTransaction } from "../../database/transaction.js";
import ordersQueries from "../../database/queries/orders.queries.js";
import { orderRequests } from "../../database/schema/orders.js";
import { orderStatuses } from "../../database/schema/public.js";

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
  ): Promise<import("../../types/orders.js").FareCalculationResult> {
    try {
      const result = await db.query(ordersQueries.CALL_CALCULATE_FARE, [
        deliveryTypeId,
        vehicleCategoryId,
        distanceKm,
        weightTierId,
        packageTypeId,
      ]);

      return result.rows[0]
        .result as import("../../types/orders.js").FareCalculationResult;
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
    orderData: Record<string, any>,
  ): Promise<import("../../types/orders.js").OrderCreateResult> {
    try {
      const result = await db.query(ordersQueries.CALL_CREATE_ORDER, [
        JSON.stringify(orderData),
      ]);

      return result.rows[0]
        .result as import("../../types/orders.js").OrderCreateResult;
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
  async findById(orderId: number) {
    try {
      const result = await db.query(ordersQueries.FIND_ORDER_BY_ID, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error finding order by ID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Find orders by client with pagination and filtering
   */
  async findByClient(
    clientId: number,
    limit: number,
    offset: number,
    status?: string,
  ) {
    try {
      // Determine which query to use based on status filter
      let ordersQuery: string;
      let countQuery: string;
      let params: any[];

      if (status === "active") {
        ordersQuery = ordersQueries.FIND_ACTIVE_ORDERS_BY_CLIENT;
        countQuery = ordersQueries.COUNT_ACTIVE_ORDERS_BY_CLIENT;
        params = [clientId, limit, offset];
      } else if (status === "completed") {
        ordersQuery = ordersQueries.FIND_COMPLETED_ORDERS_BY_CLIENT;
        countQuery = ordersQueries.COUNT_COMPLETED_ORDERS_BY_CLIENT;
        params = [clientId, limit, offset];
      } else if (status === "cancelled") {
        ordersQuery = ordersQueries.FIND_CANCELLED_ORDERS_BY_CLIENT;
        countQuery = ordersQueries.COUNT_CANCELLED_ORDERS_BY_CLIENT;
        params = [clientId, limit, offset];
      } else {
        // No status filter - get all orders
        ordersQuery = ordersQueries.FIND_ORDERS_BY_CLIENT;
        countQuery = ordersQueries.COUNT_ORDERS_BY_CLIENT;
        params = [clientId, limit, offset];
      }

      const [ordersResult, countResult] = await Promise.all([
        db.query(ordersQuery, params),
        db.query(countQuery, [clientId]),
      ]);

      return {
        orders: ordersResult.rows,
        total: Number.parseInt(countResult.rows[0].total),
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
  ) {
    try {
      const result = await db.query(
        ordersQueries.FIND_AVAILABLE_ORDERS_FOR_COURIER,
        [longitude, latitude, radiusKm, limit],
      );

      return result.rows;
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
      const result = await db.query(
        ordersQueries.CALL_CANCEL_ORDER_WITH_REFUND,
        [orderId, cancellationReason, cancelledByUserId],
      );

      return result.rows[0].result;
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
        await client.query(ordersQueries.ACCEPT_ASSIGNMENT, [orderId, courierId]);

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
   * Update order status (picked up / delivered) - migrated to Drizzle
   */
  async updateOrderStatus(orderId: number, status: string) {
    try {
      // Get status ID from status name
      const statusResult = await drizzleDb
        .select({ statusId: orderStatuses.statusId })
        .from(orderStatuses)
        .where(eq(orderStatuses.name, status))
        .limit(1);

      if (!statusResult || statusResult.length === 0) {
        throw new Error(`Invalid status: ${status}`);
      }

      const statusId = statusResult[0].statusId;
      const updateData: any = {
        statusId,
        updatedAt: new Date(),
      };

      // Set timestamp based on status
      if (status === "picked_up") {
        updateData.pickedUpAt = new Date();
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
