// services/backend/src/modules/users/users.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import { AppError, AuthenticationError } from "../../utils/error.util.js";
import usersService from "./users.service.js";

import type {
  UpdateProfileRequest,
  SaveAddressRequest,
  DeleteAddressParams,
} from "./users.zod.js";

class UsersController {
  private _requireAuthenticatedUser(request: FastifyRequest) {
    if (!request.user) {
      throw new AuthenticationError("User not authenticated");
    }
    return request.user;
  }

  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getCurrentUser(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userUuid } = this._requireAuthenticatedUser(request);

      const user = await usersService.getCurrentUser(userUuid);

      return successResponse(
        reply,
        { profile: user },
        "User profile retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get current user controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * PUT /api/v1/users/me
   * Update user profile
   */
  async updateProfile(
    request: FastifyRequest<{ Body: UpdateProfileRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = this._requireAuthenticatedUser(request);

      const updatedUser = await usersService.updateProfile(
        userId,
        request.body,
      );

      return successResponse(
        reply,
        { profile: updatedUser },
        "Profile updated successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Update profile controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * GET /api/v1/users/me/addresses
   * Get saved addresses
   */
  async getAddresses(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = this._requireAuthenticatedUser(request);

      const addresses = await usersService.getAddresses(userId);

      return successResponse(
        reply,
        {
          addresses,
          total: addresses.length,
        },
        "Addresses retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Get addresses controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * POST /api/v1/users/me/addresses
   * Save new address
   */
  async saveAddress(
    request: FastifyRequest<{ Body: SaveAddressRequest }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = this._requireAuthenticatedUser(request);

      const savedAddress = await usersService.saveAddress(userId, request.body);

      return successResponse(
        reply,
        { address: savedAddress },
        "Address saved successfully",
        201,
      );
    } catch (error) {
      logger.error({
        msg: "Save address controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }

  /**
   * DELETE /api/v1/users/me/addresses/:id
   * Delete saved address
   */
  async deleteAddress(
    request: FastifyRequest<{ Params: DeleteAddressParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    try {
      const { userId } = this._requireAuthenticatedUser(request);
      const { id } = request.params;

      const result = await usersService.deleteAddress(id, userId);

      return successResponse(
        reply,
        { deletion: result },
        "Address deleted successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Delete address controller error",
        requestId: request.id,
        error: (error as Error).message,
      });
      if (error instanceof AppError) {
        return errorResponse(reply, error.message, error.statusCode);
      }
      throw error;
    }
  }
}

export default new UsersController();
