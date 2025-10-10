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
        description: dt.description,
        pricing: {
          baseRate: parseFloat(dt.base_rate),
          perKmRate: parseFloat(dt.per_km_rate),
        },
        estimatedTimeMinutes: dt.estimated_time_minutes,
        estimatedTimeDisplay: this._formatEstimatedTime(
          dt.estimated_time_minutes,
        ),
        supportedWeightTiers: dt.supported_weight_tiers || [],
        labels: dt.labels || [],
        isActive: dt.is_active,
      }));
    } catch (error) {
      logger.error("Error getting delivery types", { error: error.message });
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
        minWeightKg: parseFloat(tier.min_weight_kg),
        maxWeightKg: parseFloat(tier.max_weight_kg),
        additionalCharge: parseFloat(tier.additional_charge),
      }));
    } catch (error) {
      logger.error("Error getting weight tiers", { error: error.message });
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
        maxWeightKg: parseFloat(cat.max_weight_kg),
        icon: cat.icon,
      }));
    } catch (error) {
      logger.error("Error getting vehicle categories", {
        error: error.message,
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
      logger.error("Error getting package types", { error: error.message });
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
        displayName: method.display_name,
        description: method.description,
        isActive: method.is_active,
      }));
    } catch (error) {
      logger.error("Error getting payment methods", { error: error.message });
      throw error;
    }
  }

  /**
   * Get all static data for create order screen
   */
  async getCreateOrderData() {
    try {
      const [
        deliveryTypes,
        weightTiers,
        vehicleCategories,
        packageTypes,
        paymentMethods,
      ] = await Promise.all([
        this.getDeliveryTypes(),
        this.getWeightTiers(),
        this.getVehicleCategories(),
        this.getPackageTypes(),
        this.getPaymentMethods(),
      ]);

      return {
        deliveryTypes,
        weightTiers,
        vehicleCategories,
        packageTypes,
        paymentMethods,
      };
    } catch (error) {
      logger.error("Error getting create order data", { error: error.message });
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
      logger.error("Error getting order statuses", { error: error.message });
      throw error;
    }
  }

  /**
   * Helper: Format estimated time for display
   */
  _formatEstimatedTime(minutes) {
    if (!minutes) return null;

    if (minutes < 60) {
      return `${minutes} mins`;
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60);
      return `${hours} ${hours === 1 ? "hour" : "hours"}`;
    } else {
      const days = Math.floor(minutes / 1440);
      return `${days} ${days === 1 ? "day" : "days"}`;
    }
  }
}

export default new StaticService();
