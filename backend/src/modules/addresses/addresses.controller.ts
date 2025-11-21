// services/backend/src/modules/addresses/addresses.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger";
import { errorResponse, successResponse } from "../../utils/response.util";
import addressesService from "./addresses.service";

interface SearchAddressesBody {
  query: string;
  proximity?: string;
  limit?: number;
}

interface RetrievePlaceBody {
  mapboxId: string;
  sessionToken: string;
}

interface ReverseGeocodeBody {
  latitude: number;
  longitude: number;
}

interface DirectionsBody {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  profile?: "driving" | "walking" | "cycling";
}

interface DistanceBody {
  lat1: number;
  lon1: number;
  lat2: number;
  lon2: number;
}

class AddressesController {
  /**
   * POST /api/v1/addresses/search
   * Search for places (step 1 of 2-step process)
   */
  async searchAddresses(
    request: FastifyRequest<{ Body: SearchAddressesBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { query, proximity, limit } = request.body;

      // Validate query
      if (!query || typeof query !== "string") {
        return errorResponse(
          reply,
          "Query is required and must be a string",
          400,
        );
      }

      if (query.length < 3) {
        return errorResponse(reply, "Query must be at least 3 characters", 400);
      }

      if (query.length > 256) {
        return errorResponse(
          reply,
          "Query must be less than 256 characters",
          400,
        );
      }

      // Validate proximity if provided
      if (proximity && typeof proximity !== "string") {
        return errorResponse(reply, "Proximity must be a string", 400);
      }

      if (proximity && proximity.length > 50) {
        return errorResponse(reply, "Proximity parameter too long", 400);
      }

      // Validate limit if provided
      if (limit !== undefined) {
        if (typeof limit !== "number" || limit < 1 || limit > 10) {
          return errorResponse(
            reply,
            "Limit must be a number between 1 and 10",
            400,
          );
        }
      }

      logger.info({
        msg: "Address search request",
        query,
        proximity,
        userId: request.user?.userId,
      });

      const searchParams: any = { query };
      if (proximity !== undefined) searchParams.proximity = proximity;
      if (limit !== undefined) searchParams.limit = limit;

      const suggestions = await addressesService.searchAddresses(searchParams);

      return successResponse(
        reply,
        suggestions,
        `Found ${suggestions.length} suggestions for "${query}"`,
      );
    } catch (error) {
      logger.error({
        msg: "Address search controller error",
        error: (error as Error).message,
        // Don't log sensitive query data in errors
      });

      // Return generic error message to avoid leaking internal details
      const isValidationError =
        (error as any).message.includes("ValidationError") ||
        (error as any).statusCode === 400;
      const userMessage = isValidationError
        ? (error as Error).message
        : "An error occurred while searching for addresses";

      return errorResponse(
        reply,
        userMessage,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/addresses/retrieve
   * Retrieve full details for a selected place (step 2 of 2-step process)
   */
  async retrievePlace(
    request: FastifyRequest<{ Body: RetrievePlaceBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { mapboxId, sessionToken } = request.body;

      // Validate required parameters
      if (!mapboxId || typeof mapboxId !== "string") {
        return errorResponse(
          reply,
          "mapboxId is required and must be a string",
          400,
        );
      }

      if (!sessionToken || typeof sessionToken !== "string") {
        return errorResponse(
          reply,
          "sessionToken is required and must be a string",
          400,
        );
      }

      // Validate parameter lengths
      if (mapboxId.length > 100) {
        return errorResponse(reply, "mapboxId parameter too long", 400);
      }

      if (sessionToken.length > 100) {
        return errorResponse(reply, "sessionToken parameter too long", 400);
      }

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
        // Don't log mapboxId in errors for security
      });

      // Return generic error message to avoid leaking internal details
      const isValidationError =
        (error as any).message.includes("ValidationError") ||
        (error as any).statusCode === 400;
      const userMessage = isValidationError
        ? (error as Error).message
        : "An error occurred while retrieving place details";

      return errorResponse(
        reply,
        userMessage,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/addresses/reverse-geocode
   * Convert coordinates to address
   */
  async reverseGeocode(
    request: FastifyRequest<{ Body: ReverseGeocodeBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { latitude, longitude } = request.body;

      // Validate required parameters
      if (latitude === undefined || longitude === undefined) {
        return errorResponse(reply, "latitude and longitude are required", 400);
      }

      // Validate coordinate types and ranges
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return errorResponse(
          reply,
          "latitude and longitude must be numbers",
          400,
        );
      }

      if (latitude < -90 || latitude > 90) {
        return errorResponse(reply, "latitude must be between -90 and 90", 400);
      }

      if (longitude < -180 || longitude > 180) {
        return errorResponse(
          reply,
          "longitude must be between -180 and 180",
          400,
        );
      }

      logger.info({
        msg: "Reverse geocoding request",
        coordinates: { latitude, longitude },
        userId: request.user?.userId,
      });

      const result = await addressesService.reverseGeocode({
        latitude,
        longitude,
        types: ["street", "neighborhood"],
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
        // Don't log sensitive coordinate data in errors
      });

      // Return generic error message to avoid leaking internal details
      const isValidationError =
        (error as any).message.includes("ValidationError") ||
        (error as any).statusCode === 400;
      const userMessage = isValidationError
        ? (error as Error).message
        : "An error occurred while converting coordinates to address";

      return errorResponse(
        reply,
        userMessage,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/addresses/directions
   * Get directions between two points
   */
  async getDirections(
    request: FastifyRequest<{ Body: DirectionsBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { origin, destination, profile } = request.body;

      // Validate required parameters
      if (!origin || typeof origin !== "object") {
        return errorResponse(
          reply,
          "origin is required and must be an object",
          400,
        );
      }

      if (!destination || typeof destination !== "object") {
        return errorResponse(
          reply,
          "destination is required and must be an object",
          400,
        );
      }

      // Validate coordinate values
      const { latitude: originLat, longitude: originLng } = origin;
      const { latitude: destLat, longitude: destLng } = destination;

      if (typeof originLat !== "number" || typeof originLng !== "number") {
        return errorResponse(reply, "origin coordinates must be numbers", 400);
      }

      if (typeof destLat !== "number" || typeof destLng !== "number") {
        return errorResponse(
          reply,
          "destination coordinates must be numbers",
          400,
        );
      }

      // Validate coordinate ranges
      if (
        originLat < -90 ||
        originLat > 90 ||
        originLng < -180 ||
        originLng > 180
      ) {
        return errorResponse(
          reply,
          "origin coordinates out of valid range",
          400,
        );
      }

      if (destLat < -90 || destLat > 90 || destLng < -180 || destLng > 180) {
        return errorResponse(
          reply,
          "destination coordinates out of valid range",
          400,
        );
      }

      // Validate profile if provided
      if (profile && !["driving", "walking", "cycling"].includes(profile)) {
        return errorResponse(
          reply,
          "profile must be one of: driving, walking, cycling",
          400,
        );
      }

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
        // Don't log coordinate data in errors for security
      });

      // Return generic error message to avoid leaking internal details
      const isValidationError =
        (error as any).message.includes("ValidationError") ||
        (error as any).statusCode === 400;
      const userMessage = isValidationError
        ? (error as Error).message
        : "An error occurred while calculating directions";

      return errorResponse(
        reply,
        userMessage,
        (error as any).statusCode || 500,
      );
    }
  }

  /**
   * POST /api/v1/addresses/distance
   * Calculate distance between two coordinates
   */
  async calculateDistance(
    request: FastifyRequest<{ Body: DistanceBody }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const { lat1, lon1, lat2, lon2 } = request.body;

      // Validate all required parameters
      if (
        lat1 === undefined ||
        lon1 === undefined ||
        lat2 === undefined ||
        lon2 === undefined
      ) {
        return errorResponse(
          reply,
          "lat1, lon1, lat2, lon2 are all required",
          400,
        );
      }

      // Validate parameter types
      if (
        typeof lat1 !== "number" ||
        typeof lon1 !== "number" ||
        typeof lat2 !== "number" ||
        typeof lon2 !== "number"
      ) {
        return errorResponse(reply, "All coordinates must be numbers", 400);
      }

      // Validate coordinate ranges
      if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
        return errorResponse(
          reply,
          "Latitude values must be between -90 and 90",
          400,
        );
      }

      if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
        return errorResponse(
          reply,
          "Longitude values must be between -180 and 180",
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
      logger.error({
        msg: "Distance calculation error",
        error: (error as Error).message,
        // Don't log coordinate data in errors for security
      });

      // Return generic error message to avoid leaking internal details
      const isValidationError =
        (error as any).message.includes("ValidationError") ||
        (error as any).statusCode === 400;
      const userMessage = isValidationError
        ? (error as Error).message
        : "An error occurred while calculating distance";

      return errorResponse(
        reply,
        userMessage,
        (error as any).statusCode || 500,
      );
    }
  }
}

export default new AddressesController();
