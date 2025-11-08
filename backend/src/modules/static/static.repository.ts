// services/backend/src/modules/static/static.repository.js
import logger from "../../config/logger";
import db from "../../database/db";
import staticQueries from "../../database/queries/static.queries";

class StaticRepository {
  /**
   * Get all delivery types
   */
  async getDeliveryTypes() {
    try {
      const result = await db.query(staticQueries.GET_DELIVERY_TYPES);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting delivery types",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get delivery type by ID
   */
  async getDeliveryTypeById(deliveryTypeId: number) {
    try {
      const result = await db.query(staticQueries.GET_DELIVERY_TYPE_BY_ID, [
        deliveryTypeId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error getting delivery type by ID",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all weight tiers
   */
  async getWeightTiers() {
    try {
      const result = await db.query(staticQueries.GET_WEIGHT_TIERS);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting weight tiers",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get weight tier for specific weight
   */
  async getWeightTierForWeight(weightKg: number) {
    try {
      const result = await db.query(staticQueries.GET_WEIGHT_TIER_FOR_WEIGHT, [
        weightKg,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error({
        msg: "Error getting weight tier for weight",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all vehicle categories
   */
  async getVehicleCategories() {
    try {
      const result = await db.query(staticQueries.GET_VEHICLE_CATEGORIES);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting vehicle categories",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get package types (labels)
   */
  async getPackageTypes() {
    try {
      const result = await db.query(staticQueries.GET_PACKAGE_TYPES);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting package types",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all labels
   */
  async getLabels() {
    try {
      const result = await db.query(staticQueries.GET_LABELS);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting labels",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods() {
    try {
      const result = await db.query(staticQueries.GET_PAYMENT_METHODS);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting payment methods",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get order statuses
   */
  async getOrderStatuses() {
    try {
      const result = await db.query(staticQueries.GET_ORDER_STATUSES);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting order statuses",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get assignment statuses
   */
  async getAssignmentStatuses() {
    try {
      const result = await db.query(staticQueries.GET_ASSIGNMENT_STATUSES);
      return result.rows;
    } catch (error) {
      logger.error({
        msg: "Error getting assignment statuses",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all static data for create order screen in a single query
   * Returns delivery types with nested vehicles and weight tiers, plus package types and payment methods
   */
  async getCreateOrderData() {
    try {
      const result = await db.query(staticQueries.GET_CREATE_ORDER_DATA);
      return result.rows[0].data;
    } catch (error) {
      logger.error({
        msg: "Error getting create order data",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new StaticRepository();
