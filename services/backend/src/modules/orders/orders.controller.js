// services/backend/src/modules/orders/orders.controller.js
import logger from "../../config/logger.js";
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../../utils/response.util.js";
import ordersService from "./orders.service.js";

class OrdersController {
  /**
   * POST /api/v1/orders/calculate-fare
   * Calculate fare estimate
   */
  async calculateFare(request, reply) {
    try {
      const fareData = request.body;

      const result = await ordersService.calculateFare(fareData);

      return successResponse(reply, result, "Fare calculated successfully");
    } catch (error) {
      logger.error("Calculate fare controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/orders
   * Create new order
   */
  async createOrder(request, reply) {
    try {
      const { userId } = request.user;
      const orderData = request.body;

      const result = await ordersService.createOrder(userId, orderData);

      return successResponse(reply, result, "Order created successfully", 201);
    } catch (error) {
      logger.error("Create order controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/orders/:id
   * Get order details
   */
  async getOrderById(request, reply) {
    try {
      const { userId, role } = request.user;
      const { id } = request.params;

      const order = await ordersService.getOrderById(
        parseInt(id),
        userId,
        role,
      );

      return successResponse(reply, order, "Order retrieved successfully");
    } catch (error) {
      logger.error("Get order controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/orders
   * List user's orders
   */
  async listOrders(request, reply) {
    try {
      const { userId } = request.user;
      const { page = 1, limit = 20 } = request.query;

      const result = await ordersService.listOrders(
        userId,
        parseInt(page),
        parseInt(limit),
      );

      return paginatedResponse(reply, result.orders, result.pagination);
    } catch (error) {
      logger.error("List orders controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/orders/available
   * Get available orders for drivers
   */
  async getAvailableOrders(request, reply) {
    try {
      const { latitude, longitude, radius = 10, limit = 20 } = request.query;

      if (!latitude || !longitude) {
        return errorResponse(reply, "Latitude and longitude are required", 400);
      }

      const orders = await ordersService.getAvailableOrders(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(radius),
        parseInt(limit),
      );

      return successResponse(
        reply,
        orders,
        "Available orders retrieved successfully",
      );
    } catch (error) {
      logger.error("Get available orders controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/orders/:id/cancel
   * Cancel order
   */
  async cancelOrder(request, reply) {
    try {
      const { userId, role } = request.user;
      const { id } = request.params;
      const { cancellationReason } = request.body;

      const result = await ordersService.cancelOrder(
        parseInt(id),
        userId,
        role,
        cancellationReason,
      );

      return successResponse(reply, result, "Order cancelled successfully");
    } catch (error) {
      logger.error("Cancel order controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/orders/:id/accept
   * Driver accepts order
   */
  async acceptOrder(request, reply) {
    try {
      const { userId } = request.user;
      const { id } = request.params;

      const result = await ordersService.acceptOrder(parseInt(id), userId);

      return successResponse(reply, result, "Order accepted successfully");
    } catch (error) {
      logger.error("Accept order controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/orders/:id/status
   * Update order status
   */
  async updateOrderStatus(request, reply) {
    try {
      const { userId } = request.user;
      const { id } = request.params;
      const { status } = request.body;

      const result = await ordersService.updateOrderStatus(
        parseInt(id),
        status,
        userId,
      );

      return successResponse(
        reply,
        result,
        "Order status updated successfully",
      );
    } catch (error) {
      logger.error("Update order status controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new OrdersController();
