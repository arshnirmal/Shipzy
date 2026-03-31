// services/backend/src/modules/orders/orders.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import "../../middleware/auth.middleware.js";
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
import { RateOrderRequestZ } from "./orders.zod.js";

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

      return successResponse(reply, result, "Fare calculated successfully");
    } catch (error) {
      logger.error({
        msg: "Calculate fare controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
    const startTime = Date.now();
    let requestId: string | undefined;

    try {
      const { userId, role } = request.user!;
      const orderData = request.body;
      requestId = request.id;

      // Log incoming request with full payload
      logger.info({
        msg: "[CREATE-ORDER] Incoming request",
        requestId,
        userId,
        userRole: role,
        payload: {
          deliveryTypeId: orderData.deliveryTypeId,
          vehicleCategoryId: orderData.vehicleCategoryId,
          weightTierId: orderData.weightTierId,
          packageTypeId: orderData.packageTypeId,
          paymentMethodId: orderData.paymentMethodId,
          pickup: {
            addressId: orderData.pickup.addressId,
            address: orderData.pickup.fullAddress,
            city: orderData.pickup.city,
            state: orderData.pickup.state,
            postalCode: orderData.pickup.postalCode,
            latitude: orderData.pickup.latitude,
            longitude: orderData.pickup.longitude,
            contactName: orderData.pickup.contactName,
            contactPhone: orderData.pickup.contactPhone,
          },
          delivery: {
            addressId: orderData.delivery.addressId,
            address: orderData.delivery.fullAddress,
            city: orderData.delivery.city,
            state: orderData.delivery.state,
            postalCode: orderData.delivery.postalCode,
            latitude: orderData.delivery.latitude,
            longitude: orderData.delivery.longitude,
            contactName: orderData.delivery.contactName,
            contactPhone: orderData.delivery.contactPhone,
          },
          fareBreakdown: orderData.fareBreakdown,
          packageDescription: orderData.packageDescription,
          specialInstructions: orderData.specialInstructions,
          declaredValue: orderData.declaredValue,
          scheduledPickupTime: orderData.scheduledPickupTime,
          scheduledDeliveryTime: orderData.scheduledDeliveryTime,
        },
      });

      const result = await ordersService.createOrder(userId, orderData);

      const responseTime = Date.now() - startTime;

      // Log successful response
      logger.info({
        msg: "[CREATE-ORDER] Order created successfully",
        requestId,
        userId,
        orderId: result.orderId,
        orderUuid: result.orderUuid,
        orderNumber: result.orderNumber,
        totalPrice: result.fareBreakdown.totalPrice,
        responseTimeMs: responseTime,
        response: result,
      });

      return successResponse(reply, result, "Order created successfully", 201);
    } catch (error) {
      const responseTime = Date.now() - startTime;

      logger.error({
        msg: "[CREATE-ORDER] Error creating order",
        requestId,
        userId: request.user?.userId,
        error: (error as Error).message,
        errorStack: (error as Error).stack,
        statusCode: (error as any).statusCode || 500,
        responseTimeMs: responseTime,
      });

      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
        Number.parseFloat(id),
        userId,
        role,
      );

      return successResponse(reply, order, "Order retrieved successfully");
    } catch (error) {
      logger.error({
        msg: "Get order controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
      );

      return paginatedResponse(reply, result.orders, result.pagination);
    } catch (error) {
      logger.error({
        msg: "List orders controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
      const {
        latitude,
        longitude,
        radius = "10",
        limit = "20",
      } = request.query;

      if (!latitude || !longitude) {
        return errorResponse(reply, "Latitude and longitude are required", 400);
      }

      const orders = await ordersService.getAvailableOrders(
        latitude,
        longitude,
        Number(radius),
        Number(limit),
      );

      return successResponse(
        reply,
        orders,
        "Available orders retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get available orders controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
        Number.parseFloat(id),
        userId,
        role,
        cancellationReason,
      );

      return successResponse(reply, result, "Order cancelled successfully");
    } catch (error) {
      logger.error({
        msg: "Cancel order controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
        Number.parseInt(id),
        userId,
      );

      return successResponse(reply, result, "Order accepted successfully");
    } catch (error) {
      logger.error({
        msg: "Accept order controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
        Number.parseFloat(id),
        status,
        userId,
      );

      return successResponse(
        reply,
        result,
        "Order status updated successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Update order status controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
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
      const parsed = RateOrderRequestZ.parse(request.body);

      const result = await ratingsService.createRating({
        orderId: Number.parseInt(id),
        customerId: userId,
        rating: parsed.rating,
        isAnonymous: parsed.anonymous ?? false,
        comment: parsed.comment ?? undefined,
      });

      return successResponse(reply, result, "Order rated successfully");
    } catch (error) {
      logger.error({
        msg: "Rate order controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }
}

export default new OrdersController();
