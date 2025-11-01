// services/backend/src/modules/users/users.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger";
import { errorResponse, successResponse } from "../../utils/response.util";
import usersService from "./users.service";

interface UpdateProfileBody {
  fullName?: string;
  email?: string;
}

interface SaveAddressBody {
  label: string;
  fullAddress: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  addressType?: "home" | "work" | "other";
  building?: string;
  floor?: string;
  flatNumber?: string;
  landmark?: string;
  isDefault?: boolean;
}

class UsersController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getCurrentUser(request: FastifyRequest, reply: FastifyReply): Promise<any> {
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
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update user profile
   */
  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileBody }>,
    reply: FastifyReply
  ): Promise<any> {
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
      logger.error({
        msg: "Update profile controller error",
        error: (error as Error).message
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * GET /api/v1/users/me/addresses
   * Get saved addresses
   */
  async getAddresses(request: FastifyRequest, reply: FastifyReply): Promise<any> {
    try {
      const { userId } = request.user;

      const addresses = await usersService.getAddresses(userId);

      return successResponse(
        reply,
        addresses,
        "Addresses retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get addresses controller error",
        error: (error as Error).message
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * POST /api/v1/users/me/addresses
   * Save new address
   */
  async saveAddress(
    request: FastifyRequest<{ Body: SaveAddressBody }>,
    reply: FastifyReply
  ): Promise<any> {
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
      logger.error({
        msg: "Save address controller error",
        error: (error as Error).message
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   * Delete saved address
   */
  async deleteAddress(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<any> {
    try {
      const { userId } = request.user;
      const { id } = request.params;

      const result = await usersService.deleteAddress(parseInt(id), userId);

      return successResponse(reply, result, "Address deleted successfully");
    } catch (error) {
      logger.error({
        msg: "Delete address controller error",
        error: (error as Error).message
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }
}

export default new UsersController();
