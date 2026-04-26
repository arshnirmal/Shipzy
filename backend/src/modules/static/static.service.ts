// services/backend/src/modules/static/static.service.ts
import staticRepository from "./static.repository.js";
import type {
  CreateOrderData,
  DeliveryType,
  PackageType,
  StaticPaymentMethod,
  SupportedVehicle,
  VehicleCategory,
  WeightTier,
} from "./static.zod.js";

class StaticService {
  private _toNumber(value: unknown): number {
    const n =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(n) ? n : 0;
  }

  private _mapWeightTier(tier: {
    tierId: number;
    name: string;
    minWeightKg: number | string;
    maxWeightKg: number | string;
    additionalCharge: number | string;
  }): WeightTier {
    return {
      tierId: tier.tierId,
      name: tier.name,
      minWeightKg: this._toNumber(tier.minWeightKg),
      maxWeightKg: this._toNumber(tier.maxWeightKg),
      additionalCharge: this._toNumber(tier.additionalCharge),
    };
  }

  private _mapSupportedVehicle(vehicle: {
    categoryId: number;
    name: string;
    displayName?: string | null;
    maxWeightKg: number | string;
    iconUrl?: string | null;
    weightTiers: Array<{
      tierId: number;
      name: string;
      minWeightKg: number | string;
      maxWeightKg: number | string;
      additionalCharge: number | string;
    }>;
  }): SupportedVehicle {
    return {
      categoryId: vehicle.categoryId,
      name: vehicle.name,
      displayName: vehicle.displayName ?? undefined,
      maxWeightKg: this._toNumber(vehicle.maxWeightKg),
      iconUrl: vehicle.iconUrl ?? undefined,
      weightTiers: vehicle.weightTiers.map((tier) => this._mapWeightTier(tier)),
    };
  }

  private _mapDeliveryType(deliveryType: {
    deliveryTypeId: number;
    name: string;
    displayName?: string | null;
    description?: string | null;
    baseRate: number | string;
    perKmRate: number | string;
    sortOrder: number | string;
    isActive: boolean;
    supportedVehicles: Array<{
      categoryId: number;
      name: string;
      displayName?: string | null;
      maxWeightKg: number | string;
      iconUrl?: string | null;
      weightTiers: Array<{
        tierId: number;
        name: string;
        minWeightKg: number | string;
        maxWeightKg: number | string;
        additionalCharge: number | string;
      }>;
    }>;
  }): DeliveryType {
    return {
      deliveryTypeId: deliveryType.deliveryTypeId,
      name: deliveryType.name,
      displayName: deliveryType.displayName ?? undefined,
      description: deliveryType.description ?? null,
      pricing: {
        baseRate: this._toNumber(deliveryType.baseRate),
        perKmRate: this._toNumber(deliveryType.perKmRate),
      },
      supportedVehicles: deliveryType.supportedVehicles.map((vehicle) =>
        this._mapSupportedVehicle(vehicle),
      ),
      sortOrder: Math.max(
        0,
        Math.floor(this._toNumber(deliveryType.sortOrder)),
      ),
      isActive: deliveryType.isActive,
    };
  }

  async getDeliveryTypes(): Promise<DeliveryType[]> {
    const deliveryTypes = await staticRepository.getDeliveryTypes();

    return deliveryTypes.map((deliveryType) =>
      this._mapDeliveryType(deliveryType),
    );
  }

  async getWeightTiers(): Promise<WeightTier[]> {
    const tiers = await staticRepository.getWeightTiers();

    return tiers.map((tier) => this._mapWeightTier(tier));
  }

  async getVehicleCategories(): Promise<VehicleCategory[]> {
    const categories = await staticRepository.getVehicleCategories();

    return categories.map((cat) => ({
      categoryId: cat.categoryId,
      name: cat.name,
      displayName: cat.displayName ?? undefined,
      description: cat.description ?? undefined,
      maxWeightKg: this._toNumber(cat.maxWeightKg),
      iconUrl: cat.iconUrl ?? undefined,
      isActive: cat.isActive,
    }));
  }

  async getPackageTypes(): Promise<PackageType[]> {
    const types = await staticRepository.getPackageTypes();

    return types.map((type) => ({
      packageTypeId: type.packageTypeId,
      name: type.name,
      description: type.description ?? undefined,
    }));
  }

  async getPaymentMethods(): Promise<StaticPaymentMethod[]> {
    const methods = await staticRepository.getPaymentMethods();

    return methods.map((method) => ({
      methodId: method.methodId,
      name: method.name,
      displayName: method.name,
      description: method.description ?? undefined,
      isActive: method.isActive,
    }));
  }

  async getCreateOrderData(): Promise<CreateOrderData> {
    const data = await staticRepository.getCreateOrderData();

    return {
      deliveryTypes: data.deliveryTypes.map((deliveryType) =>
        this._mapDeliveryType(deliveryType),
      ),
      packageTypes: data.packageTypes.map((type) => ({
        packageTypeId: type.packageTypeId,
        name: type.name,
        description: type.description ?? undefined,
      })),
      paymentMethods: data.paymentMethods.map((method) => ({
        methodId: method.methodId,
        name: method.name,
        displayName: method.name,
        description: method.description ?? undefined,
        isActive: method.isActive,
      })),
    };
  }

  async getOrderStatuses(): Promise<string[]> {
    const statuses = await staticRepository.getOrderStatuses();

    return statuses.map((status) => status.name);
  }
}

export default new StaticService();
