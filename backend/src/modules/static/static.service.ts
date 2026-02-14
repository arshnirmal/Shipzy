// services/backend/src/modules/static/static.service.js
import logger from "../../config/logger.js";
import staticRepository from "./static.repository.js";

class StaticService {
  /**
   * Get all delivery types with pricing info
   */
  async getDeliveryTypes() {
    try {
      const deliveryTypes = await staticRepository.getDeliveryTypes();

      return deliveryTypes.map((dt) => ({
        deliveryTypeId: dt.delivery_type_id,
        name: dt.name,
        displayName: dt.display_name,
        description: dt.description,
        pricing: {
          baseRate: Number.parseFloat(dt.base_rate),
          perKmRate: Number.parseFloat(dt.per_km_rate),
        },
        labels: dt.labels || [],
        supportedVehicles: dt.supported_vehicles || [],
        sortOrder: dt.sort_order,
        isActive: dt.is_active,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting delivery types",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get weight tiers
   */
  async getWeightTiers() {
    try {
      const tiers = await staticRepository.getWeightTiers();

      return tiers.map((tier) => ({
        tierId: tier.tier_id,
        name: tier.name,
        minWeightKg: Number.parseFloat(tier.min_weight_kg),
        maxWeightKg: Number.parseFloat(tier.max_weight_kg),
        additionalCharge: Number.parseFloat(tier.additional_charge),
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting weight tiers",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get vehicle categories
   */
  async getVehicleCategories() {
    try {
      const categories = await staticRepository.getVehicleCategories();

      return categories.map((cat) => ({
        categoryId: cat.category_id,
        name: cat.name,
        description: cat.description,
        maxWeightKg: cat.max_weight_kg,
        icon: cat.icon_url,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting vehicle categories",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get package types (for order creation screen)
   */
  async getPackageTypes() {
    try {
      const types = await staticRepository.getPackageTypes();

      return types.map((type) => ({
        packageTypeId: type.package_type_id,
        name: type.name,
        description: type.description,
        icon: type.icon,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting package types",
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
      const methods = await staticRepository.getPaymentMethods();

      return methods.map((method) => ({
        methodId: method.method_id,
        name: method.name,
        displayName: method.name,
        description: method.description,
        isActive: method.is_active,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting payment methods",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all static data for create order screen
   * Returns delivery types with nested vehicles and weight tiers, plus package types and payment methods
   */
  async getCreateOrderData() {
    try {
      return await staticRepository.getCreateOrderData();
    } catch (error) {
      logger.error({
        msg: "Error getting create order data",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get order tracking statuses
   */
  async getOrderStatuses() {
    try {
      const statuses = await staticRepository.getOrderStatuses();

      return statuses.map((status) => ({
        statusId: status.status_id,
        name: status.name,
        description: status.description,
      }));
    } catch (error) {
      logger.error({
        msg: "Error getting order statuses",
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new StaticService();
