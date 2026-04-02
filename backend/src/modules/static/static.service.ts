// services/backend/src/modules/static/static.service.ts
import staticRepository from "./static.repository.js";

class StaticService {
  async getDeliveryTypes() {
    const deliveryTypes = await staticRepository.getDeliveryTypes();

    return deliveryTypes.map((dt) => ({
      deliveryTypeId: dt.delivery_type_id,
      name: dt.name,
      displayName: dt.display_name,
      description: dt.description,
      pricing: {
        baseRate: this._toNumber(dt.base_rate),
        perKmRate: this._toNumber(dt.per_km_rate),
      },
      supportedVehicles: dt.supported_vehicles || [],
      sortOrder: dt.sort_order,
      isActive: dt.is_active,
    }));
  }

  async getWeightTiers() {
    const tiers = await staticRepository.getWeightTiers();

    return tiers.map((tier) => ({
      tierId: tier.tierId,
      name: tier.name,
      minWeightKg: this._toNumber(tier.minWeightKg),
      maxWeightKg: this._toNumber(tier.maxWeightKg),
      additionalCharge: this._toNumber(tier.additionalCharge),
    }));
  }

  async getVehicleCategories() {
    const categories = await staticRepository.getVehicleCategories();

    return categories.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      description: cat.description,
      maxWeightKg:
        cat.maxWeightKg == null ? undefined : this._toNumber(cat.maxWeightKg),
      icon: cat.iconUrl,
    }));
  }

  async getPackageTypes() {
    const types = await staticRepository.getPackageTypes();

    return types.map((type) => ({
      packageTypeId: type.packageTypeId,
      name: type.name,
      description: type.description,
      icon: null as string | null,
    }));
  }

  async getPaymentMethods() {
    const methods = await staticRepository.getPaymentMethods();

    return methods.map((method) => ({
      methodId: method.methodId,
      name: method.name,
      displayName: method.name,
      description: method.description,
      isActive: method.isActive,
    }));
  }

  async getCreateOrderData() {
    return staticRepository.getCreateOrderData();
  }

  async getOrderStatuses() {
    const statuses = await staticRepository.getOrderStatuses();

    return statuses.map((status) => ({
      statusId: status.statusId,
      name: status.name,
      description: status.description,
    }));
  }

  private _toNumber(value: unknown): number {
    const n =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
  }
}

export default new StaticService();
