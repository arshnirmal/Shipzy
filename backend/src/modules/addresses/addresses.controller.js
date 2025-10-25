// services/backend/src/modules/addresses/addresses.controller.js
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import addressesService from "./addresses.service.js";

class AddressesController {
  /**
   * POST /api/v1/addresses/search
   * Search for places (step 1 of 2-step process)
   */
  async searchAddresses(request, reply) {
    try {
      const { query, proximity, limit } = request.body;

      if (!query || query.length < 3) {
        return errorResponse(reply, "Query must be at least 3 characters", 400);
      }

      logger.info("Address search request", {
        query,
        proximity,
        userId: request.user?.userId,
      });

      const suggestions = await addressesService.searchAddresses({
        query,
        proximity,
        limit,
      });

      return successResponse(
        reply,
        suggestions,
        `Found ${suggestions.length} suggestions for "${query}"`,
      );
    } catch (error) {
      logger.error("Address search controller error", {
        error: error.message,
        query: request.body?.query,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/retrieve
   * Retrieve full details for a selected place (step 2 of 2-step process)
   */
  async retrievePlace(request, reply) {
    try {
      const { mapboxId, sessionToken } = request.body;

      if (!mapboxId || !sessionToken) {
        return errorResponse(
          reply,
          "mapboxId and sessionToken are required",
          400,
        );
      }

      logger.info("Place retrieve request", {
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
      logger.error("Place retrieve controller error", {
        error: error.message,
        mapboxId: request.body?.mapboxId,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/reverse-geocode
   * Convert coordinates to address
   */
  async reverseGeocode(request, reply) {
    try {
      const { latitude, longitude } = request.body;

      if (latitude === undefined || longitude === undefined) {
        return errorResponse(reply, "latitude and longitude are required", 400);
      }

      logger.info("Reverse geocoding request", {
        coordinates: { latitude, longitude },
        userId: request.user?.userId,
      });

      const result = await addressesService.reverseGeocode({
        latitude,
        longitude,
      });

      return successResponse(
        reply,
        result,
        `Reverse geocode completed for (${longitude}, ${latitude})`,
      );
    } catch (error) {
      logger.error("Reverse geocoding controller error", {
        error: error.message,
        coordinates: request.body,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/directions
   * Get directions between two points
   */
  async getDirections(request, reply) {
    try {
      const { origin, destination, profile } = request.body;

      if (!origin || !destination) {
        return errorResponse(reply, "origin and destination are required", 400);
      }

      logger.info("Directions request", {
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
      logger.error("Directions controller error", {
        error: error.message,
        origin: request.body?.origin,
        destination: request.body?.destination,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/distance
   * Calculate distance between two coordinates
   */
  async calculateDistance(request, reply) {
    try {
      const { lat1, lon1, lat2, lon2 } = request.body;

      if ([lat1, lon1, lat2, lon2].some((coord) => coord === undefined)) {
        return errorResponse(
          reply,
          "lat1, lon1, lat2, lon2 are all required",
          400,
        );
      }

      const distance = addressesService.calculateDistance(
        lat1,
        lon1,
        lat2,
        lon2,
      );

      return successResponse(
        reply,
        { distanceKm: distance },
        `Distance calculated: ${distance}km`,
      );
    } catch (error) {
      logger.error("Distance calculation error", {
        error: error.message,
        coordinates: request.body,
      });
      return errorResponse(reply, error.message, error.statusCode || 500);
    }
  }
}

export default new AddressesController();
