// services/backend/src/modules/static/static.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger";
import { errorResponse, successResponse } from "../../utils/response.util";
import staticService from "./static.service";

class StaticController {
  /**
   * GET /api/v1/static/delivery-types
   * Get all delivery types with pricing
   */
  async getDeliveryTypes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const deliveryTypes = await staticService.getDeliveryTypes();

      return successResponse(
        reply,
        deliveryTypes,
        "Delivery types retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get delivery types controller error",
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
   * GET /api/v1/static/weight-tiers
   * Get all weight tiers
   */
  async getWeightTiers(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const weightTiers = await staticService.getWeightTiers();

      return successResponse(
        reply,
        weightTiers,
        "Weight tiers retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get weight tiers controller error",
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
   * GET /api/v1/static/vehicle-categories
   * Get all vehicle categories
   */
  async getVehicleCategories(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const categories = await staticService.getVehicleCategories();

      return successResponse(
        reply,
        categories,
        "Vehicle categories retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get vehicle categories controller error",
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
   * GET /api/v1/static/package-types
   * Get all package types
   */
  async getPackageTypes(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const packageTypes = await staticService.getPackageTypes();

      return successResponse(
        reply,
        packageTypes,
        "Package types retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get package types controller error",
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
   * GET /api/v1/static/payment-methods
   * Get all payment methods
   */
  async getPaymentMethods(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const paymentMethods = await staticService.getPaymentMethods();

      return successResponse(
        reply,
        paymentMethods,
        "Payment methods retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get payment methods controller error",
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
   * GET /api/v1/static/create-order-data
   * Get all static data needed for create order screen
   */
  async getCreateOrderData(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const data = await staticService.getCreateOrderData();

      return successResponse(
        reply,
        data,
        "Create order data retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get create order data controller error",
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
   * GET /api/v1/static/order-statuses
   * Get all order statuses
   */
  async getOrderStatuses(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const statuses = await staticService.getOrderStatuses();

      return successResponse(
        reply,
        statuses,
        "Order statuses retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get order statuses controller error",
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

export default new StaticController();
