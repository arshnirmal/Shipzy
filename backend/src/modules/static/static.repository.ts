// services/backend/src/modules/static/static.repository.ts
import { eq, and, sql } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb, { drizzlePool } from "../../database/drizzle.js";
import { AppError } from "../../utils/error.util.js";
import cacheUtil from "../../utils/cache.util.js";
import staticQueries from "../../database/queries/static.queries.js";
import {
  StaticCreateOrderDataDbZ,
  StaticDeliveryTypeDbZ,
  StaticDeliveryTypeMasterDbZ,
  StaticPackageTypeDbZ,
  StaticPaymentMethodDbZ,
  StaticStatusRowDbZ,
  StaticVehicleCategoryDbZ,
  StaticWeightTierDbZ,
} from "../../schemas/db.zod.js";
import { parseDbRow, parseDbRows } from "../../utils/db-parse.util.js";
import {
  deliveryTypes,
  weightTiers,
  vehicleCategories,
  packageTypes,
} from "../../database/schema/public.js";
import { paymentMethods } from "../../database/schema/payments.js";

class StaticRepository {
  /**
   * Get all delivery types (complex query with joins - keep as raw SQL)
   */
  async getDeliveryTypes() {
    try {
      const result = await drizzlePool.query(staticQueries.GET_DELIVERY_TYPES);
      return parseDbRows(
        StaticDeliveryTypeDbZ,
        result.rows,
        "static delivery types",
      );
    } catch (error) {
      logger.error({
        msg: "Error getting delivery types",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get delivery type by ID (migrated to Drizzle with caching)
   */
  async getDeliveryTypeById(deliveryTypeId: number) {
    try {
      // Check cache first
      const cacheKey = `delivery_type:${deliveryTypeId}`;
      const cached = await cacheUtil.get(cacheKey);
      if (cached) {
        return parseDbRow(
          StaticDeliveryTypeMasterDbZ,
          cached,
          "static delivery type",
        );
      }

      const result = await drizzleDb
        .select()
        .from(deliveryTypes)
        .where(
          and(
            eq(deliveryTypes.deliveryTypeId, deliveryTypeId),
            eq(deliveryTypes.isActive, true),
          ),
        )
        .limit(1);

      const deliveryType = result[0] || null;

      // Cache for 1 hour
      if (deliveryType) {
        const parsedDeliveryType = parseDbRow(
          StaticDeliveryTypeMasterDbZ,
          deliveryType,
          "static delivery type",
        );
        await cacheUtil.set(cacheKey, parsedDeliveryType, 3600);
        return parsedDeliveryType;
      }

      return deliveryType;
    } catch (error) {
      logger.error({
        msg: "Error getting delivery type by ID",
        deliveryTypeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all weight tiers (migrated to Drizzle)
   */
  async getWeightTiers() {
    try {
      const result = await drizzleDb
        .select()
        .from(weightTiers)
        .orderBy(weightTiers.minWeightKg);

      return parseDbRows(StaticWeightTierDbZ, result, "static weight tiers");
    } catch (error) {
      logger.error({
        msg: "Error getting weight tiers",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get weight tier for specific weight (migrated to Drizzle)
   */
  async getWeightTierForWeight(weightKg: number) {
    try {
      const result = await drizzleDb
        .select()
        .from(weightTiers)
        .where(
          and(
            sql`${weightTiers.minWeightKg}::numeric <= ${String(weightKg)}::numeric`,
            sql`${weightTiers.maxWeightKg}::numeric > ${String(weightKg)}::numeric`,
          ),
        )
        .limit(1);

      const tier = result[0] || null;
      if (!tier) {
        return null;
      }

      return parseDbRow(StaticWeightTierDbZ, tier, "static weight tier");
    } catch (error) {
      logger.error({
        msg: "Error getting weight tier for weight",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all vehicle categories (migrated to Drizzle)
   */
  async getVehicleCategories() {
    try {
      const result = await drizzleDb
        .select()
        .from(vehicleCategories)
        .where(eq(vehicleCategories.isActive, true))
        .orderBy(vehicleCategories.maxWeightKg);

      return parseDbRows(
        StaticVehicleCategoryDbZ,
        result,
        "static vehicle categories",
      );
    } catch (error) {
      logger.error({
        msg: "Error getting vehicle categories",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get package types (migrated to Drizzle)
   */
  async getPackageTypes() {
    try {
      const result = await drizzleDb
        .select()
        .from(packageTypes)
        .orderBy(packageTypes.name);

      return parseDbRows(StaticPackageTypeDbZ, result, "static package types");
    } catch (error) {
      logger.error({
        msg: "Error getting package types",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get payment methods (migrated to Drizzle)
   */
  async getPaymentMethods() {
    try {
      const result = await drizzleDb
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.isActive, true))
        .orderBy(paymentMethods.methodId);

      return parseDbRows(
        StaticPaymentMethodDbZ,
        result,
        "static payment methods",
      );
    } catch (error) {
      logger.error({
        msg: "Error getting payment methods",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get order statuses (migrated to Drizzle)
   */
  async getOrderStatuses() {
    try {
      const result = await drizzlePool.query(staticQueries.GET_ORDER_STATUSES);
      return parseDbRows(StaticStatusRowDbZ, result.rows, "order statuses");
    } catch (error) {
      logger.error({
        msg: "Error getting order statuses",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get assignment statuses (migrated to Drizzle)
   */
  async getAssignmentStatuses() {
    try {
      const result = await drizzlePool.query(
        staticQueries.GET_ASSIGNMENT_STATUSES,
      );
      return parseDbRows(
        StaticStatusRowDbZ,
        result.rows,
        "assignment statuses",
      );
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
   * (Complex query with CTEs and JSON aggregation - keep as raw SQL)
   */
  async getCreateOrderData() {
    try {
      const result = await drizzlePool.query(
        staticQueries.GET_CREATE_ORDER_DATA,
      );
      const data = result.rows[0]?.data;
      if (!data) {
        throw new AppError("Create order static data is unavailable", 500);
      }
      return parseDbRow(
        StaticCreateOrderDataDbZ,
        data,
        "create order static data",
      );
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
