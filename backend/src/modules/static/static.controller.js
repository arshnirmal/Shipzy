// services/backend/src/modules/static/static.controller.js
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import staticService from "./static.service.js";

class StaticController {
  /**
   * GET /api/v1/static/delivery-types
   * Get all delivery types with pricing
   */
  async getDeliveryTypes(request, reply) {
    try {
      const deliveryTypes = await staticService.getDeliveryTypes();

      return successResponse(
        reply,
        deliveryTypes,
        "Delivery types retrieved successfully",
      );
    } catch (error) {
      logger.error("Get delivery types controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/weight-tiers
   * Get all weight tiers
   */
  async getWeightTiers(request, reply) {
    try {
      const weightTiers = await staticService.getWeightTiers();

      return successResponse(
        reply,
        weightTiers,
        "Weight tiers retrieved successfully",
      );
    } catch (error) {
      logger.error("Get weight tiers controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/vehicle-categories
   * Get all vehicle categories
   */
  async getVehicleCategories(request, reply) {
    try {
      const categories = await staticService.getVehicleCategories();

      return successResponse(
        reply,
        categories,
        "Vehicle categories retrieved successfully",
      );
    } catch (error) {
      logger.error("Get vehicle categories controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/package-types
   * Get all package types
   */
  async getPackageTypes(request, reply) {
    try {
      const packageTypes = await staticService.getPackageTypes();

      return successResponse(
        reply,
        packageTypes,
        "Package types retrieved successfully",
      );
    } catch (error) {
      logger.error("Get package types controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/payment-methods
   * Get all payment methods
   */
  async getPaymentMethods(request, reply) {
    try {
      const paymentMethods = await staticService.getPaymentMethods();

      return successResponse(
        reply,
        paymentMethods,
        "Payment methods retrieved successfully",
      );
    } catch (error) {
      logger.error("Get payment methods controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/create-order-data
   * Get all static data needed for create order screen
   */
  async getCreateOrderData(request, reply) {
    try {
      const data = await staticService.getCreateOrderData();

      return successResponse(
        reply,
        data,
        "Create order data retrieved successfully",
      );
    } catch (error) {
      logger.error("Get create order data controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/static/order-statuses
   * Get all order statuses
   */
  async getOrderStatuses(request, reply) {
    try {
      const statuses = await staticService.getOrderStatuses();

      return successResponse(
        reply,
        statuses,
        "Order statuses retrieved successfully",
      );
    } catch (error) {
      logger.error("Get order statuses controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new StaticController();
