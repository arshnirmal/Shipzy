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
    reply: FastifyReply
  ): Promise<any> {
    try {
      const { query, proximity, limit } = request.body;

      if (!query || query.length < 3) {
        return errorResponse(reply, "Query must be at least 3 characters", 400);
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
        query: request.body?.query,
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/retrieve
   * Retrieve full details for a selected place (step 2 of 2-step process)
   */
  async retrievePlace(
    request: FastifyRequest<{ Body: RetrievePlaceBody }>,
    reply: FastifyReply
  ): Promise<any> {
    try {
      const { mapboxId, sessionToken } = request.body;

      if (!mapboxId || !sessionToken) {
        return errorResponse(
          reply,
          "mapboxId and sessionToken are required",
          400,
        );
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
        mapboxId: request.body?.mapboxId,
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/reverse-geocode
   * Convert coordinates to address
   */
  async reverseGeocode(
    request: FastifyRequest<{ Body: ReverseGeocodeBody }>,
    reply: FastifyReply
  ): Promise<any> {
    try {
      const { latitude, longitude } = request.body;

      if (latitude === undefined || longitude === undefined) {
        return errorResponse(reply, "latitude and longitude are required", 400);
      }

      logger.info({
        msg: "Reverse geocoding request",
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
      logger.error({
        msg: "Reverse geocoding controller error",
        error: (error as Error).message,
        coordinates: request.body,
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/directions
   * Get directions between two points
   */
  async getDirections(
    request: FastifyRequest<{ Body: DirectionsBody }>,
    reply: FastifyReply
  ): Promise<any> {
    try {
      const { origin, destination, profile } = request.body;

      if (!origin || !destination) {
        return errorResponse(reply, "origin and destination are required", 400);
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
        origin: request.body?.origin,
        destination: request.body?.destination,
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }

  /**
   * POST /api/v1/addresses/distance
   * Calculate distance between two coordinates
   */
  async calculateDistance(
    request: FastifyRequest<{ Body: DistanceBody }>,
    reply: FastifyReply
  ): Promise<any> {
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
      logger.error({
        msg: "Distance calculation error",
        error: (error as Error).message,
        coordinates: request.body,
      });
      return errorResponse(reply, (error as Error).message, (error as any).statusCode || 500);
    }
  }
}

export default new AddressesController();
