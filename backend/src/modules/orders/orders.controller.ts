// services/backend/src/modules/orders/orders.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../../utils/response.util.js";
import ordersService from "./orders.service.js";
import ratingsService from "../ratings/ratings.service.js";
import type {
  CreateOrderRequest as OrderData,
  CalculateFareRequest,
  CancelOrderRequest,
  RateOrderRequest,
  UpdateOrderStatusRequest,
  OrderParams,
  ListOrdersQuery,
  AvailableOrdersQuery,
} from "./orders.zod.js";

class OrdersController {
  /**
   * POST /api/v1/orders/calculate-fare
   * Calculate fare estimate
   */
  async calculateFare(
    request: FastifyRequest<{ Body: CalculateFareRequest }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const fareData = request.body;

      const result = await ordersService.calculateFare(fareData);

      logger.info({
        msg: "POST /api/v1/orders/calculate-fare",
        statusCode: 200,
        distanceKm: fareData.drop?.latitude ? "calculated" : "pending",
      });

      return successResponse(reply, result, "Fare calculated successfully");
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/orders
   * Create new order
   */
  async createOrder(
    request: FastifyRequest<{ Body: OrderData }>,
    reply: FastifyReply,
  ) {
    let requestId: string | undefined;

    try {
      const { userId, role } = request.user!;
      const orderData = request.body;
      requestId = request.id;

      const result = await ordersService.createOrder(userId, orderData);

      logger.info({
        msg: "Order created",
        requestId,
        userId,
        orderId: result.orderId,
        statusCode: 201,
      });

      return successResponse(reply, result, "Order created successfully", 201);
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * GET /api/v1/orders/:id
   * Get order details
   */
  async getOrderById(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, role } = request.user!;
      const { id } = request.params;

      const order = await ordersService.getOrderById(
        Number.parseInt(id, 10),
        userId,
        role,
      );

      logger.info({
        msg: "GET /api/v1/orders/:id",
        statusCode: 200,
        userId,
        orderId: id,
      });

      return successResponse(reply, order, "Order retrieved successfully");
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * GET /api/v1/orders
   * List user's orders
   */
  async listOrders(
    request: FastifyRequest<{ Querystring: ListOrdersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const {
        page = 1,
        limit = 20,
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      } = request.query;

      const result = await ordersService.listOrders(
        userId,
        page,
        limit,
        status,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
      );

      logger.info({
        msg: "GET /api/v1/orders",
        statusCode: 200,
        userId,
        page,
        limit,
        count: result.orders.length,
        total: result.pagination.total,
      });

      return paginatedResponse(reply, result.orders, result.pagination);
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * GET /api/v1/orders/available
   * Get available orders for drivers
   */
  async getAvailableOrders(
    request: FastifyRequest<{ Querystring: AvailableOrdersQuery }>,
    reply: FastifyReply,
  ) {
    try {
      const { latitude, longitude, radius, limit } = request.query;

      const orders = await ordersService.getAvailableOrders(
        latitude,
        longitude,
        radius,
        limit,
      );

      logger.info({
        msg: "GET /api/v1/orders/available",
        statusCode: 200,
        count: orders.length,
        radius,
        limit,
      });

      return successResponse(
        reply,
        orders,
        "Available orders retrieved successfully",
      );
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/orders/:id/cancel
   * Cancel order
   */
  async cancelOrder(
    request: FastifyRequest<{ Params: OrderParams; Body: CancelOrderRequest }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId, role } = request.user!;
      const { id } = request.params;
      const { cancellationReason } = request.body;

      const result = await ordersService.cancelOrder(
        Number.parseInt(id, 10),
        userId,
        role,
        cancellationReason,
      );

      logger.info({
        msg: "POST /api/v1/orders/:id/cancel",
        statusCode: 200,
        userId,
        orderId: id,
      });

      return successResponse(reply, result, "Order cancelled successfully");
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/orders/:id/accept
   * Driver accepts order
   */
  async acceptOrder(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const { id } = request.params;

      const result = await ordersService.acceptOrder(
        Number.parseInt(id, 10),
        userId,
      );

      logger.info({
        msg: "POST /api/v1/orders/:id/accept",
        statusCode: 200,
        userId,
        orderId: id,
      });

      return successResponse(reply, result, "Order accepted successfully");
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * PUT /api/v1/orders/:id/status
   * Update order status
   */
  async updateOrderStatus(
    request: FastifyRequest<{
      Params: OrderParams;
      Body: UpdateOrderStatusRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const { id } = request.params;
      const { status } = request.body;

      const result = await ordersService.updateOrderStatus(
        Number.parseInt(id, 10),
        status,
        userId,
      );

      logger.info({
        msg: "PUT /api/v1/orders/:id/status",
        statusCode: 200,
        userId,
        orderId: id,
        newStatus: status,
      });

      return successResponse(
        reply,
        result,
        "Order status updated successfully",
      );
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }

  /**
   * POST /api/v1/orders/:id/rate
   * Rate a delivered order (customer only)
   */
  async rateOrder(
    request: FastifyRequest<{
      Params: OrderParams;
      Body: RateOrderRequest;
    }>,
    reply: FastifyReply,
  ) {
    try {
      const { userId } = request.user!;
      const { id } = request.params;
      const { rating, anonymous, comment } = request.body;

      const result = await ratingsService.createRating({
        orderId: Number.parseInt(id, 10),
        customerId: userId,
        rating,
        isAnonymous: anonymous ?? false,
        comment: comment ?? undefined,
      });

      logger.info({
        msg: "POST /api/v1/orders/:id/rate",
        statusCode: 200,
        userId,
        orderId: id,
        rating,
      });

      return successResponse(reply, result, "Order rated successfully");
    } catch (error) {
      return errorResponse(
        reply,
        (error as Error).message,
        error instanceof AppError ? error.statusCode : 500,
      );
    }
  }
}

export default new OrdersController();
