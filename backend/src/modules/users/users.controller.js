// services/backend/src/modules/users/users.controller.js
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import usersService from "./users.service.js";

class UsersController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getCurrentUser(request, reply) {
    try {
      const { userUuid } = request.user;

      const user = await usersService.getCurrentUser(userUuid);

      return successResponse(
        reply,
        user,
        "User profile retrieved successfully",
      );
    } catch (error) {
      logger.error("Get current user controller error", {
        error: error.message,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update user profile
   */
  async updateProfile(request, reply) {
    try {
      const { userId } = request.user;
      const updateData = request.body;

      const updatedUser = await usersService.updateProfile(userId, updateData);

      return successResponse(
        reply,
        updatedUser,
        "Profile updated successfully",
      );
    } catch (error) {
      logger.error("Update profile controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * GET /api/v1/users/me/addresses
   * Get saved addresses
   */
  async getAddresses(request, reply) {
    try {
      const { userId } = request.user;

      const addresses = await usersService.getAddresses(userId);

      return successResponse(
        reply,
        addresses,
        "Addresses retrieved successfully",
      );
    } catch (error) {
      logger.error("Get addresses controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/users/me/addresses
   * Save new address
   */
  async saveAddress(request, reply) {
    try {
      const { userId } = request.user;
      const addressData = request.body;

      const savedAddress = await usersService.saveAddress(userId, addressData);

      return successResponse(
        reply,
        savedAddress,
        "Address saved successfully",
        201,
      );
    } catch (error) {
      logger.error("Save address controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   * Delete saved address
   */
  async deleteAddress(request, reply) {
    try {
      const { userId } = request.user;
      const { id } = request.params;

      const result = await usersService.deleteAddress(parseInt(id), userId);

      return successResponse(reply, result, "Address deleted successfully");
    } catch (error) {
      logger.error("Delete address controller error", { error: error.message });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new UsersController();
