// services/backend/src/modules/orders/orders.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError, RetryAfterError } from "../../utils/error.util.js";
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../../utils/response.util.js";
import ordersService from "./orders.service.js";
import type {
  CreateOrderRequest as OrderData,
  CalculateFareRequest,
  CancelOrderRequest,
  UpdateOrderStatusRequest,
  OrderParams,
  ListOrdersQuery,
  AvailableOrdersQuery,
  ArriveRequest,
  UndeliverableRequest,
  ProofOfDeliveryRequest,
} from "./orders.zod.js";

class OrdersController {
  /**
   * POST /api/v1/orders/calculate-fare
   * Calculate fare estimate
   */
  async calculateFare(
    request: FastifyRequest<{ Body: CalculateFareRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const fareData = request.body;

      const result = await ordersService.calculateFare(fareData);

      logger.info({
        msg: "POST /api/v1/orders/calculate-fare",
        statusCode: 200,
        distanceKm: fareData.locations?.delivery?.latitude
          ? "calculated"
          : "pending",
      });

      return successResponse(reply, result, "Fare calculated successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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
      const { userId } = request.user!;
      const orderData = request.body;
      requestId = request.id;

      const result = await ordersService.createOrder(userId, orderData);

      logger.info({
        msg: "Order created",
        requestId,
        userId,
        orderId: result.order.identifiers.orderId,
        statusCode: 201,
      });

      return successResponse(reply, result, "Order created successfully", 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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

      const order = await ordersService.getOrderById(id, userId, role);

      logger.info({
        msg: "GET /api/v1/orders/:id",
        statusCode: 200,
        userId,
        orderId: id,
      });

      return successResponse(reply, order, "Order retrieved successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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
        search,
        deliveryTypeId,
        minPrice,
        maxPrice,
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
        search,
        deliveryTypeId,
        minPrice,
        maxPrice,
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

      return paginatedResponse(
        reply,
        result.orders,
        result.pagination,
        "Orders retrieved successfully",
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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
      const {
        cancellation: { reason: cancellationReason },
      } = request.body;

      const result = await ordersService.cancelOrder(
        id,
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
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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

      const result = await ordersService.acceptOrder(id, userId);

      logger.info({
        msg: "POST /api/v1/orders/:id/accept",
        statusCode: 200,
        userId,
        orderId: id,
      });

      return successResponse(reply, result, "Order accepted successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
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
      const {
        transition: { status },
      } = request.body;

      const result = await ordersService.updateOrderStatus(id, status, userId);

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
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  // ============ DRIVER ORDER ACTIONS ============

  /**
   * POST /api/v1/orders/:id/arrive
   */
  async arriveAtDelivery(
    request: FastifyRequest<{ Params: OrderParams; Body: ArriveRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const orderId = Number(request.params.id);
      const result = await ordersService.arriveAtDelivery(
        orderId,
        userId,
        request.body,
      );
      return successResponse(reply, result.data, "Arrived at delivery location");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/orders/:id/undeliverable
   */
  async markUndeliverable(
    request: FastifyRequest<{ Params: OrderParams; Body: UndeliverableRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const orderId = Number(request.params.id);
      const result = await ordersService.markUndeliverable(
        orderId,
        userId,
        request.body,
      );
      return successResponse(reply, result.data, "Order marked undeliverable");
    } catch (error) {
      if (error instanceof RetryAfterError) {
        return errorResponse(reply, error.message, 400, { retryAfter: error.retryAfter });
      }
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/orders/:id/return
   */
  async startReturn(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const orderId = Number(request.params.id);
      const result = await ordersService.startReturn(orderId, userId);
      return successResponse(reply, result.data, "Return initiated");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/orders/:id/returned
   */
  async confirmReturned(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const orderId = Number(request.params.id);
      const result = await ordersService.confirmReturned(orderId, userId);
      return successResponse(reply, result.data, "Order returned successfully");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/orders/:id/proof-of-delivery
   */
  async submitProofOfDelivery(
    request: FastifyRequest<{
      Params: OrderParams;
      Body: ProofOfDeliveryRequest;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const orderId = Number(request.params.id);
      const result = await ordersService.submitProofOfDelivery(
        orderId,
        userId,
        request.body,
      );
      return successResponse(
        reply,
        result.data,
        "Proof of delivery submitted",
        201,
      );
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/orders/:id/tracking
   */
  async getOrderTracking(
    request: FastifyRequest<{ Params: OrderParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const userId = request.user!.userId;
      const userRole = request.user!.role;
      const orderId = Number(request.params.id);
      const result = await ordersService.getOrderTracking(
        orderId,
        userId,
        userRole,
      );
      return successResponse(reply, result.data, "Order tracking data");
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new OrdersController();
