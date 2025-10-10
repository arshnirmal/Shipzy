// services/backend/src/modules/static/static.repository.js
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import staticQueries from "../../database/queries/static.queries.js";

class StaticRepository {
  /**
   * Get all delivery types
   */
  async getDeliveryTypes() {
    try {
      const result = await db.query(staticQueries.GET_DELIVERY_TYPES);
      return result.rows;
    } catch (error) {
      logger.error("Error getting delivery types", { error: error.message });
      throw error;
    }
  }

  /**
   * Get delivery type by ID
   */
  async getDeliveryTypeById(deliveryTypeId) {
    try {
      const result = await db.query(staticQueries.GET_DELIVERY_TYPE_BY_ID, [
        deliveryTypeId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error getting delivery type by ID", {
        error: error.message,
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
      logger.error("Error getting weight tiers", { error: error.message });
      throw error;
    }
  }

  /**
   * Get weight tier for specific weight
   */
  async getWeightTierForWeight(weightKg) {
    try {
      const result = await db.query(staticQueries.GET_WEIGHT_TIER_FOR_WEIGHT, [
        weightKg,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error getting weight tier for weight", {
        error: error.message,
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
      logger.error("Error getting vehicle categories", {
        error: error.message,
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
      logger.error("Error getting package types", { error: error.message });
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
      logger.error("Error getting labels", { error: error.message });
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
      logger.error("Error getting payment methods", { error: error.message });
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
      logger.error("Error getting order statuses", { error: error.message });
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
      logger.error("Error getting assignment statuses", {
        error: error.message,
      });
      throw error;
    }
  }
}

export default new StaticRepository();
