// services/backend/src/modules/addresses/addresses.controller.ts
import { FastifyRequest, FastifyReply } from "fastify";
import logger from "../../config/logger.js";
import { errorResponse, successResponse } from "../../utils/response.util.js";
import addressesService from "./addresses.service.js";
import type {
  SearchAddresses,
  RetrievePlace,
  ReverseGeocode,
  Directions,
  Distance,
} from "./addresses.zod.js";
import {
  SearchAddressesZ,
  RetrievePlaceZ,
  ReverseGeocodeZ,
  DirectionsZ,
  DistanceZ,
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
      const parsed = SearchAddressesZ.parse(request.body);

      logger.info({
        msg: "Address search request",
        query: parsed.query,
        proximity: parsed.proximity,
        userId: request.user?.userId,
      });

      const suggestions = await addressesService.searchAddresses(parsed);

      return successResponse(
        reply,
        suggestions,
        `Found ${suggestions.length} suggestions for "${parsed.query}"`,
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
    request: FastifyRequest<{ Body: RetrievePlace }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = RetrievePlaceZ.parse(request.body);

      logger.info({
        msg: "Place retrieve request",
        mapboxId: parsed.mapboxId,
        userId: request.user?.userId,
      });

      const placeDetails = await addressesService.retrievePlace(
        parsed.mapboxId,
        parsed.sessionToken,
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
    request: FastifyRequest<{ Body: ReverseGeocode }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = ReverseGeocodeZ.parse(request.body);

      logger.info({
        msg: "Reverse geocoding request",
        coordinates: { latitude: parsed.latitude, longitude: parsed.longitude },
        userId: request.user?.userId,
      });

      const result = await addressesService.reverseGeocode({
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        types: parsed.types || ["street", "neighborhood"],
      });

      return successResponse(
        reply,
        result,
        `Reverse geocode completed for (${parsed.longitude}, ${parsed.latitude})`,
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
    request: FastifyRequest<{ Body: Directions }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = DirectionsZ.parse(request.body);

      logger.info({
        msg: "Directions request",
        origin: parsed.origin,
        destination: parsed.destination,
        profile: parsed.profile,
        userId: request.user?.userId,
      });

      const result = await addressesService.getDirections(
        parsed.origin,
        parsed.destination,
        parsed.profile,
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
    request: FastifyRequest<{ Body: Distance }>,
    reply: FastifyReply,
  ): Promise<any> {
    try {
      const parsed = DistanceZ.parse(request.body);

      const distance = addressesService.calculateDistance(
        parsed.lat1,
        parsed.lon1,
        parsed.lat2,
        parsed.lon2,
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
