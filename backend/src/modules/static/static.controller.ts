// services/backend/src/modules/static/static.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import staticService from "./static.service.js";

class StaticController {
  /**
   * GET /api/v1/static/delivery-types
   * Get all delivery types with pricing
   */
  async getDeliveryTypes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const deliveryTypes = await staticService.getDeliveryTypes();

      return successResponse(
        reply,
        {
          deliveryTypes,
          total: deliveryTypes.length,
        },
        "Delivery types retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get delivery types controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/weight-tiers
   * Get all weight tiers
   */
  async getWeightTiers(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const weightTiers = await staticService.getWeightTiers();

      return successResponse(
        reply,
        {
          weightTiers,
          total: weightTiers.length,
        },
        "Weight tiers retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get weight tiers controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/vehicle-categories
   * Get all vehicle categories
   */
  async getVehicleCategories(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const categories = await staticService.getVehicleCategories();

      return successResponse(
        reply,
        {
          vehicleCategories: categories,
          total: categories.length,
        },
        "Vehicle categories retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get vehicle categories controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/package-types
   * Get all package types
   */
  async getPackageTypes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const packageTypes = await staticService.getPackageTypes();

      return successResponse(
        reply,
        {
          packageTypes,
          total: packageTypes.length,
        },
        "Package types retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get package types controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/payment-methods
   * Get all payment methods
   */
  async getPaymentMethods(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const paymentMethods = await staticService.getPaymentMethods();

      return successResponse(
        reply,
        {
          paymentMethods,
          total: paymentMethods.length,
        },
        "Payment methods retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get payment methods controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/create-order-data
   * Get all static data needed for create order screen
   */
  async getCreateOrderData(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const data = await staticService.getCreateOrderData();

      return successResponse(
        reply,
        { createOrder: data },
        "Create order data retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get create order data controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/static/order-statuses
   * Get all order statuses
   */
  async getOrderStatuses(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const statuses = await staticService.getOrderStatuses();

      return successResponse(
        reply,
        {
          orderStatuses: statuses,
          total: statuses.length,
        },
        "Order statuses retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get order statuses controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new StaticController();
