import logger from "../../config/logger.js";
import db from "../../database/db.js";

export class PricingRepository {
  /**
   * Get pricing configuration value by key
   */
  async getPricingConfigValue(key: string): Promise<number | null> {
    try {
      const result = await db.query(
        `SELECT config_value FROM public.pricing_config WHERE config_key = $1 AND is_active = TRUE`,
        [key],
      );
      return result.rows[0]?.config_value || null;
    } catch (error) {
      logger.error({
        msg: "Error getting pricing config value",
        key,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get all active pricing configuration
   */
  async getAllPricingConfig(): Promise<Map<string, number>> {
    try {
      const result = await db.query(
        `SELECT config_key, config_value FROM public.pricing_config WHERE is_active = TRUE`,
      );

      const config = new Map<string, number>();
      result.rows.forEach((row) => {
        config.set(row.config_key, Number.parseFloat(row.config_value));
      });

      return config;
    } catch (error) {
      logger.error({
        msg: "Error getting all pricing config",
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Update pricing configuration value
   */
  async updatePricingConfig(
    key: string,
    value: number,
    updatedBy: number,
  ): Promise<void> {
    try {
      await db.query(
        `
        UPDATE public.pricing_config
        SET config_value = $1, updated_by = $2, updated_at = NOW()
        WHERE config_key = $3
      `,
        [value, updatedBy, key],
      );
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

  /**
   * Get special handling fee for package type
   */
  async getSpecialHandlingFee(packageTypeId: number): Promise<number> {
    try {
      const result = await db.query(
        `SELECT special_handling_fee FROM public.package_types WHERE package_type_id = $1`,
        [packageTypeId],
      );
      return result.rows[0]?.special_handling_fee || 0;
    } catch (error) {
      logger.error({
        msg: "Error getting special handling fee",
        packageTypeId,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

export default new PricingRepository();
