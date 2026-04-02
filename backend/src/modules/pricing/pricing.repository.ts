import { and, eq } from "drizzle-orm";
import logger from "../../config/logger.js";
import drizzleDb from "../../database/drizzle.js";
import { packageTypes, pricingConfig } from "../../database/schema/public.js";

class PricingRepository {
  async getPricingConfigValue(key: string): Promise<number | null> {
    try {
      const result = await drizzleDb
        .select({
          configValue: pricingConfig.configValue,
        })
        .from(pricingConfig)
        .where(
          and(eq(pricingConfig.configKey, key), eq(pricingConfig.isActive, true)),
        )
        .limit(1);

      const value = result[0]?.configValue;
      return value == null ? null : this._toNumber(value);
    } catch (error) {
      logger.error({
        msg: "Error getting pricing config value",
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getAllPricingConfig(): Promise<Map<string, number>> {
    try {
      const rows = await drizzleDb
        .select({
          configKey: pricingConfig.configKey,
          configValue: pricingConfig.configValue,
        })
        .from(pricingConfig)
        .where(eq(pricingConfig.isActive, true));

      const config = new Map<string, number>();
      for (const row of rows) {
        config.set(row.configKey, this._toNumber(row.configValue));
      }
      return config;
    } catch (error) {
      logger.error({
        msg: "Error getting all pricing config",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async updatePricingConfig(
    key: string,
    value: number,
    updatedBy: number,
  ): Promise<void> {
    try {
      await drizzleDb
        .update(pricingConfig)
        .set({
          configValue: value,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(pricingConfig.configKey, key));
    } catch (error) {
      logger.error({
        msg: "Error updating pricing config",
        key,
        value,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async getSpecialHandlingFee(packageTypeId: number): Promise<number> {
    try {
      const result = await drizzleDb
        .select({
          specialHandlingFee: packageTypes.specialHandlingFee,
        })
        .from(packageTypes)
        .where(eq(packageTypes.packageTypeId, packageTypeId))
        .limit(1);

      const fee = result[0]?.specialHandlingFee;
      return fee == null ? 0 : this._toNumber(fee);
    } catch (error) {
      logger.error({
        msg: "Error getting special handling fee",
        packageTypeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private _toNumber(value: unknown): number {
    const parsed =
      typeof value === "number" ? value : Number.parseFloat(String(value));
    return Number.isFinite(parsed) ? parsed : 0;
  }
}

export default new PricingRepository();
