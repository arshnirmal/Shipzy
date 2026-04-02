// services/backend/src/modules/addresses/addresses.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { AppError } from "../../utils/error.util.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import addressesService from "./addresses.service.js";
import type {
  SearchAddresses,
  RetrievePlace,
  ReverseGeocode,
  Directions,
  Distance,
} from "./addresses.zod.js";

class AddressesController {
  /**
   * POST /api/v1/addresses/search
   * Search for places (step 1 of 2-step process)
   */
  async searchAddresses(
    request: FastifyRequest<{ Body: SearchAddresses }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { query } = request.body;

      logger.info({
        msg: "Address search request",
        query,
        proximity: request.body.proximity,
        userId: request.user?.userId,
      });

      const suggestions = await addressesService.searchAddresses(request.body);

      return successResponse(
        reply,
        suggestions,
        `Found ${suggestions.length} suggestions for "${query}"`,
      );
    } catch (error) {
      logger.error({
        msg: "Address search controller error",
        error: (error as Error).message,
      });

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const userMessage = error instanceof AppError
        ? error.message
        : "An error occurred while searching for addresses";

      return errorResponse(reply, userMessage, statusCode);
    }
  }

  /**
   * POST /api/v1/addresses/retrieve
   * Retrieve full details for a selected place (step 2 of 2-step process)
   */
  async retrievePlace(
    request: FastifyRequest<{ Body: RetrievePlace }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { mapboxId, sessionToken } = request.body;

      logger.info({
        msg: "Place retrieve request",
        mapboxId,
        userId: request.user?.userId,
      });

      const placeDetails = await addressesService.retrievePlace(
        mapboxId,
        sessionToken,
      );

      return successResponse(
        reply,
        placeDetails,
        "Place details retrieved successfully",
      );
    } catch (error) {
      logger.error({
        msg: "Place retrieve controller error",
        error: (error as Error).message,
      });

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const userMessage = error instanceof AppError
        ? error.message
        : "An error occurred while retrieving place details";

      return errorResponse(reply, userMessage, statusCode);
    }
  }

  /**
   * POST /api/v1/addresses/reverse-geocode
   * Convert coordinates to address
   */
  async reverseGeocode(
    request: FastifyRequest<{ Body: ReverseGeocode }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { latitude, longitude, types } = request.body;

      logger.info({
        msg: "Reverse geocoding request",
        coordinates: { latitude, longitude },
        userId: request.user?.userId,
      });

      const result = await addressesService.reverseGeocode({
        latitude,
        longitude,
        types: types || ["street", "neighborhood"],
      });

      return successResponse(
        reply,
        result,
        `Reverse geocode completed for (${longitude}, ${latitude})`,
      );
    } catch (error) {
      logger.error({
        msg: "Reverse geocoding controller error",
        error: (error as Error).message,
      });

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const userMessage = error instanceof AppError
        ? error.message
        : "An error occurred while converting coordinates to address";

      return errorResponse(reply, userMessage, statusCode);
    }
  }

  /**
   * POST /api/v1/addresses/directions
   * Get directions between two points
   */
  async getDirections(
    request: FastifyRequest<{ Body: Directions }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { origin, destination, profile } = request.body;

      logger.info({
        msg: "Directions request",
        origin,
        destination,
        profile,
        userId: request.user?.userId,
      });

      const result = await addressesService.getDirections(
        origin,
        destination,
        profile,
      );

      return successResponse(
        reply,
        result,
        `Directions calculated: ${result.distanceKm}km, ${result.durationMinutes}min`,
      );
    } catch (error) {
      logger.error({
        msg: "Directions controller error",
        error: (error as Error).message,
      });

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const userMessage = error instanceof AppError
        ? error.message
        : "An error occurred while calculating directions";

      return errorResponse(reply, userMessage, statusCode);
    }
  }

  /**
   * POST /api/v1/addresses/distance
   * Calculate distance between two coordinates
   */
  async calculateDistance(
    request: FastifyRequest<{ Body: Distance }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { lat1, lon1, lat2, lon2 } = request.body;

      const distance = addressesService.calculateDistance(lat1, lon1, lat2, lon2);

      return successResponse(
        reply,
        { distanceKm: distance },
        `Distance calculated: ${distance}km`,
      );
    } catch (error) {
      logger.error({
        msg: "Distance calculation error",
        error: (error as Error).message,
      });

      const statusCode = error instanceof AppError ? error.statusCode : 500;
      const userMessage = error instanceof AppError
        ? error.message
        : "An error occurred while calculating distance";

      return errorResponse(reply, userMessage, statusCode);
    }
  }
}

export default new AddressesController();
