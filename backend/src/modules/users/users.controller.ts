// services/backend/src/modules/users/users.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import { AuthenticationError } from "../../utils/error.util.js";
import usersService from "./users.service.js";

import type {
  UpdateProfile,
  SaveAddress,
  DeleteAddressParams,
} from "./users.zod.js";

class UsersController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      if (!request.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const { userUuid } = request.user;

      const user = await usersService.getCurrentUser(userUuid);

      return successResponse(
        reply,
        user,
        "User profile retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get current user controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update user profile
   */
  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfile }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      if (!request.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const { userId } = request.user;
      // validate/parse using Zod schema at controller boundary
      const updateData = (await import("./users.zod.js")).UpdateProfileZ.parse(
        request.body,
      );

      const updatedUser = await usersService.updateProfile(userId, updateData);

      return successResponse(
        reply,
        updatedUser,
        "Profile updated successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Update profile controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * GET /api/v1/users/me/addresses
   * Get saved addresses
   */
  async getAddresses(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      if (!request.user) {
        throw new AuthenticationError("User not authenticated");
      }

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
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/users/me/addresses
   * Save new address
   */
  async saveAddress(
    request: FastifyRequest<{ Body: SaveAddress }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      if (!request.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const { userId } = request.user;
      const addressData = (await import("./users.zod.js")).SaveAddressZ.parse(
        request.body,
      );

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
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   * Delete saved address
   */
  async deleteAddress(
    request: FastifyRequest<{ Params: DeleteAddressParams }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      if (!request.user) {
        throw new AuthenticationError("User not authenticated");
      }

      const { userId } = request.user;
      const { id } = (
        await import("./users.zod.js")
      ).DeleteAddressParamsZ.parse(request.params);

      const result = await usersService.deleteAddress(
        Number.parseInt(id),
        userId,
      );

      return successResponse(reply, result, "Address deleted successfully");
    } catch (error) {
      logger.error({
        msg: "Delete address controller error",
        error: (error as Error).message,
      });
      return errorResponse(
        reply,
        (error as Error).message,
        (error as any).statusCode || 500,
      );
    }
  }
}

export default new UsersController();
