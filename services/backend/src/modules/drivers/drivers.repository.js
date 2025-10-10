// services/backend/src/modules/drivers/drivers.repository.js
import logger from "../../config/logger.js";
import db from "../../database/db.js";
import driversQueries from "../../database/queries/drivers.queries.js";

class DriversRepository {
  /**
   * Find courier by user ID
   */
  async findCourierById(userId) {
    try {
      const result = await db.query(driversQueries.FIND_COURIER_BY_USER_ID, [
        userId,
      ]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error("Error finding courier by ID", { error: error.message });
      throw error;
    }
  }

  /**
   * Update courier profile
   */
  async updateProfile(userId, updateData) {
    try {
      const { fullName, email, profilePictureUrl } = updateData;

      const result = await db.query(driversQueries.UPDATE_COURIER_PROFILE, [
        userId,
        fullName || null,
        email || null,
        profilePictureUrl || null,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error("Error updating courier profile", { error: error.message });
      throw error;
    }
  }

  /**
   * Update courier availability
   */
  async updateAvailability(courierId, isAvailable, isOnline) {
    try {
      const result = await db.query(
        driversQueries.UPDATE_COURIER_AVAILABILITY,
        [courierId, isAvailable, isOnline],
      );

      return result.rows[0];
    } catch (error) {
      logger.error("Error updating courier availability", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Update courier location
   */
  async updateLocation(courierId, latitude, longitude) {
    try {
      const result = await db.query(driversQueries.UPDATE_COURIER_LOCATION, [
        courierId,
        longitude,
        latitude,
      ]);

      return result.rows[0];
    } catch (error) {
      logger.error("Error updating courier location", { error: error.message });
      throw error;
    }
  }

  /**
   * Get courier active assignments
   */
  async getActiveAssignments(courierId) {
    try {
      const result = await db.query(
        driversQueries.FIND_COURIER_ACTIVE_ASSIGNMENTS,
        [courierId],
      );
      return result.rows;
    } catch (error) {
      logger.error("Error getting courier assignments", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get courier earnings summary
   */
  async getEarningsSummary(courierId) {
    try {
      const result = await db.query(
        driversQueries.GET_COURIER_EARNINGS_SUMMARY,
        [courierId],
      );
      return result.rows[0];
    } catch (error) {
      logger.error("Error getting courier earnings", { error: error.message });
      throw error;
    }
  }
}

export default new DriversRepository();
