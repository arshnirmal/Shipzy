// services/backend/src/modules/orders/orders.repository.js
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import ordersQueries from "../../database/queries/orders.queries.js";

class OrdersRepository {
  /**
   * Calculate fare using stored function
   */
  async calculateFare(deliveryTypeId, distanceKm, weightKg) {
    try {
      const result = await db.query(ordersQueries.CALL_CALCULATE_FARE, [
        deliveryTypeId,
        distanceKm,
        weightKg || 0,
      ]);

      return result.rows[0].result;
    } catch (error) {
      logger.error("Error calculating fare", { error: error.message });
      throw error;
    }
  }

  /**
   * Create order using stored function
   */
  async createOrder(orderData) {
    try {
      const result = await db.query(ordersQueries.CALL_CREATE_ORDER, [
        JSON.stringify(orderData),
      ]);

      return result.rows[0].result;
    } catch (error) {
      logger.error("Error creating order", { error: error.message });
      throw error;
    }
  }

  /**
   * Find order by ID
   */
  async findById(orderId) {
    try {
      const result = await db.query(ordersQueries.FIND_ORDER_BY_ID, [orderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding order by ID", { error: error.message });
      throw error;
    }
  }

  /**
   * Find orders by client with pagination
   */
  async findByClient(clientId, limit, offset) {
    try {
      const [ordersResult, countResult] = await Promise.all([
        db.query(ordersQueries.FIND_ORDERS_BY_CLIENT, [
          clientId,
          limit,
          offset,
        ]),
        db.query(ordersQueries.COUNT_ORDERS_BY_CLIENT, [clientId]),
      ]);

      return {
        orders: ordersResult.rows,
        total: parseInt(countResult.rows[0].total),
      };
    } catch (error) {
      logger.error("Error finding orders by client", { error: error.message });
      throw error;
    }
  }

  /**
   * Find available orders for courier
   */
  async findAvailableOrders(latitude, longitude, radiusKm, limit) {
    try {
      const result = await db.query(
        ordersQueries.FIND_AVAILABLE_ORDERS_FOR_COURIER,
        [
          null, // Placeholder for courier_id (not used in WHERE clause)
          longitude,
          latitude,
          radiusKm,
          limit,
        ],
      );

      return result.rows;
    } catch (error) {
      logger.error("Error finding available orders", { error: error.message });
      throw error;
    }
  }

  /**
   * Cancel order using stored function
   */
  async cancelOrder(orderId, cancellationReason, cancelledByUserId) {
    try {
      const result = await db.query(
        ordersQueries.CALL_CANCEL_ORDER_WITH_REFUND,
        [orderId, cancellationReason, cancelledByUserId],
      );

      return result.rows[0].result;
    } catch (error) {
      logger.error("Error cancelling order", { error: error.message });
      throw error;
    }
  }

  /**
   * Accept order (driver accepts)
   */
  async acceptOrder(orderId, courierId) {
    const client = await db.getClient();

    try {
      await client.query("BEGIN");

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

      await client.query("COMMIT");

      return assignmentResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      logger.error("Error accepting order", { error: error.message });
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Update order status (picked up / delivered)
   */
  async updateOrderStatus(orderId, status) {
    try {
      let result;

      if (status === "picked_up") {
        result = await db.query(ordersQueries.MARK_ORDER_PICKED_UP, [orderId]);
      } else if (status === "delivered") {
        result = await db.query(ordersQueries.MARK_ORDER_DELIVERED, [orderId]);
      } else {
        throw new Error("Invalid status");
      }

      return result.rows[0];
    } catch (error) {
      logger.error("Error updating order status", { error: error.message });
      throw error;
    }
  }
}

export default new OrdersRepository();
