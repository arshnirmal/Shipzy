// services/backend/src/modules/orders/orders.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger";
import "../../middleware/auth.middleware";
import {
  errorResponse,
  paginatedResponse,
  successResponse,
} from "../../utils/response.util";
import ordersService, { OrderData } from "./orders.service";

interface CalculateFareBody {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  weightTierId: number;
  pickup: {
    lat: number;
    lng: number;
  };
  drop: {
    lat: number;
    lng: number;
  };
}

interface CreateOrderBody {
  deliveryTypeId: number;
  vehicleCategoryId: number;
  paymentMethodId: number;
  pickupAddressId: number;
  deliveryAddressId: number;
  packageDescription?: string;
  weightKg?: number;
  specialInstructions?: string;
}

interface OrderParams {
  id: string;
}

interface CancelOrderBody {
  cancellationReason: string;
}

type ListOrdersQuery = {
  page?: string;
  limit?: string;
  status?: string;
};

interface GetAvailableOrdersQuery {
  latitude?: string;
  longitude?: string;
  radius?: string;
  limit?: string;
}

interface UpdateOrderStatusBody {
  status: string;
}

class OrdersController {
  /**
   * POST /api/v1/orders/calculate-fare
   * Calculate fare estimate
   */
  async calculateFare(
    request: FastifyRequest<{ Body: CalculateFareBody }>,
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
    try {
      const { userId } = request.user!;
      const orderData = request.body;

      const result = await ordersService.createOrder(userId, orderData);

      return successResponse(reply, result, "Order created successfully", 201);
    } catch (error) {
      logger.error({
        msg: "Create order controller error",
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
      const { page = "1", limit = "20", status } = request.query;
      const pageNum = Number.parseFloat(page) || 1;
      const limitNum = Number.parseFloat(limit) || 20;

      const result = await ordersService.listOrders(
        userId,
        pageNum,
        limitNum,
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
    request: FastifyRequest<{ Querystring: GetAvailableOrdersQuery }>,
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
        Number.parseFloat(latitude),
        Number.parseFloat(longitude),
        Number.parseFloat(radius),
        Number.parseFloat(limit),
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
    request: FastifyRequest<{ Params: OrderParams; Body: CancelOrderBody }>,
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
      Body: UpdateOrderStatusBody;
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
}

export default new OrdersController();
