// services/backend/src/modules/addresses/addresses.service.ts
import axios from "axios";
import NodeCache from "node-cache";
import logger from "../../config/logger";
import { ValidationError } from "../../utils/error.util";

interface SearchParams {
  query: string;
  proximity?: string;
  limit?: number;
  types?: string;
  country?: string;
  language?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface GeocodeParams {
  latitude: number;
  longitude: number;
  types?: string[];
}

interface DirectionsOrigin {
  latitude: number;
  longitude: number;
}

interface DirectionsDestination {
  latitude: number;
  longitude: number;
}

// Cache for 1 hour (reduce API calls)
const searchCache = new NodeCache({ stdTTL: 3600 });

class AddressesService {
  private readonly baseUrl: string;
  private readonly mapboxAccessToken: string;

  constructor() {
    this.baseUrl = process.env.MAPBOX_BASE_URL || "https://api.mapbox.com";
    this.mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN || "";

    if (!this.mapboxAccessToken) {
      logger.warn(
        "MAPBOX_ACCESS_TOKEN not configured - Mapbox API calls will fail",
      );
    }
  }

  /**
   * Search for places/addresses using Mapbox Search Box API
   * Returns suggestions (first step of two-step process)
   */
  async searchAddresses(searchParams: SearchParams): Promise<any> {
    try {
      const {
        query,
        proximity = "72.8777,19.0760", // Mumbai coordinates as default
        limit = 10,
        types = "address,poi",
        country = "IN",
        language = "en",
      } = searchParams;

      // Check cache
      const cacheKey = `search:${query}:${proximity}`;
      const cached = searchCache.get(cacheKey);
      if (cached) {
        logger.info({ msg: "Returning cached search results", query });
        return cached;
      }

      // Generate session token for this search session
      const sessionToken = this._generateSessionToken();

      // Call Mapbox Search Box API
      const response = await axios.get(
        `${this.baseUrl}/search/searchbox/v1/suggest`,
        {
          params: {
            q: query,
            access_token: this.mapboxAccessToken,
            session_token: sessionToken,
            proximity,
            limit,
            types,
            country,
            language,
          },
          timeout: 5000,
          headers: {
            "User-Agent": "Shipzy-Backend/1.0",
          },
        },
      );

      const suggestions = response.data.suggestions.map((item: any) => ({
        id: item.mapbox_id,
        name: item.name,
        fullAddress: item.full_address || item.place_formatted,
        placeType: item.feature_type,
        coordinates: {
          latitude: item.coordinates?.latitude,
          longitude: item.coordinates?.longitude,
        },
        context: this._parseContext(item.context),
        sessionToken, // Include session token for retrieve step
      }));

      // Cache results
      searchCache.set(cacheKey, suggestions);

      logger.info({
        msg: "Mapbox search completed",
        query,
        resultCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error({
        msg: "Mapbox search error",
        error: (error as Error).message,
        query: searchParams.query,
        status: (error as any).response?.status,
      });

      if ((error as any).response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if ((error as any).response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(
        `Address search failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Retrieve full details for a selected place
   */
  async retrievePlace(mapboxId: string, sessionToken: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search/searchbox/v1/retrieve/${mapboxId}`,
        {
          params: {
            access_token: this.mapboxAccessToken,
            session_token: sessionToken,
          },
          timeout: 5000,
          headers: {
            "User-Agent": "Shipzy-Backend/1.0",
          },
        },
      );

      const feature = response.data.features[0];

      return {
        id: feature.properties.mapbox_id,
        name: feature.properties.name,
        fullAddress: feature.properties.full_address,
        coordinates: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
        },
        context: this._parseContext(feature.properties.context),
        featureType: feature.geometry.type,
        bbox: feature.bbox,
      };
    } catch (error) {
      logger.error({
        msg: "Mapbox retrieve error",
        error: (error as Error).message,
        mapboxId,
        status: (error as any).response?.status,
      });

      if ((error as any).response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if ((error as any).response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(
        `Failed to retrieve place details: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Reverse geocode coordinates to address using Mapbox Geocoding v6 API
   */
  async reverseGeocode(geocodeParams: GeocodeParams) {
    try {
      if (!this.mapboxAccessToken) {
        throw new ValidationError("Mapbox API key not configured");
      }

      let { longitude, latitude, types } = geocodeParams;

      // Validate and round coordinates to 7 decimal places (centimeter precision)
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        throw new ValidationError("Invalid coordinate format");
      }

      if (latitude < -90 || latitude > 90) {
        throw new ValidationError("Latitude must be between -90 and 90");
      }

      if (longitude < -180 || longitude > 180) {
        throw new ValidationError("Longitude must be between -180 and 180");
      }

      // Round to 7 decimal places to avoid precision issues
      latitude = Math.round(latitude * 10000000) / 10000000;
      longitude = Math.round(longitude * 10000000) / 10000000;

      // Build reverse geocoding parameters for Mapbox Geocoding v6
      const defaultTypes = "address,poi";
      const requestTypes = types ? types.join(",") : defaultTypes;

      const params = new URLSearchParams({
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        access_token: this.mapboxAccessToken,
        types: requestTypes,
        limit: "5",
        language: "en",
      });

      // Log the exact parameters being sent
      logger.info({
        msg: "Reverse geocoding parameters (v6 API)",
        longitude,
        latitude,
        types: requestTypes,
        limit: 5,
        language: "en",
      });

      // Use Mapbox Geocoding v6 endpoint
      const url = `${this.baseUrl}/search/geocode/v6/reverse?${params.toString()}`;

      logger.info({
        msg: "Making Mapbox Reverse Geocoding v6 API request",
        url: url.replace(this.mapboxAccessToken, "***"),
        coordinates: { longitude, latitude },
        types,
      });

      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          "User-Agent": "Shipzy-Backend/1.0",
        },
      });

      // Transform Mapbox response to our format
      const features = response.data.features || [];

      const results = features.map((feature: any) => ({
        id: feature.id,
        name: feature.text,
        fullAddress: feature.place_name,
        placeName: feature.place_name,
        coordinates: {
          longitude: feature.center[0],
          latitude: feature.center[1],
        },
        featureType: feature.place_type[0],
        properties: feature.properties,
        context: feature.context,
        bbox: feature.bbox,
        relevance: feature.relevance,
      }));

      logger.info({
        msg: "Mapbox reverse geocoding completed",
        coordinates: { longitude, latitude },
        resultsCount: results.length,
      });

      return {
        coordinates: { longitude, latitude },
        results,
        total: results.length,
      };
    } catch (error) {
      const axiosError = error as any;
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      const errorMessage = axiosError.message;

      // Try to extract meaningful error message from response
      let mapboxErrorMessage = errorMessage;
      if (responseData) {
        if (typeof responseData === "string") {
          mapboxErrorMessage = responseData;
        } else if (responseData.message) {
          mapboxErrorMessage = responseData.message;
        } else if (responseData.error) {
          mapboxErrorMessage = responseData.error;
        }
      }

      logger.error({
        msg: "Mapbox reverse geocoding failed",
        error: errorMessage,
        mapboxError: mapboxErrorMessage,
        coordinates: {
          longitude: geocodeParams.longitude,
          latitude: geocodeParams.latitude,
        },
        status,
        responseData,
        url: axiosError.config?.url?.replace(this.mapboxAccessToken, "***"),
      });

      if (status === 401) {
        throw new ValidationError(
          "Invalid Mapbox API key - check if Geocoding API is enabled",
        );
      }

      if (status === 403) {
        throw new ValidationError(
          "Mapbox API access forbidden - check API key permissions",
        );
      }

      if (status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      if (status === 422) {
        throw new ValidationError(
          `Invalid coordinates or parameters for reverse geocoding: ${mapboxErrorMessage}`,
        );
      }

      throw new ValidationError(
        `Reverse geocoding failed: ${mapboxErrorMessage}`,
      );
    }
  }

  /**
   * Get directions between two points using Mapbox Directions API
   */
  async getDirections(
    origin: DirectionsOrigin,
    destination: DirectionsDestination,
    profile: "driving" | "walking" | "cycling" = "driving",
  ) {
    try {
      const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

      const response = await axios.get(
        `${this.baseUrl}/directions/v5/mapbox/${profile}/${coords}`,
        {
          params: {
            access_token: this.mapboxAccessToken,
            geometries: "geojson",
            overview: "full",
            steps: false,
          },
          timeout: 5000,
          headers: {
            "User-Agent": "Shipzy-Backend/1.0",
          },
        },
      );

      const route = response.data.routes[0];
      if (!route) {
        throw new ValidationError(
          "No route found between the specified points",
        );
      }

      return {
        distance: route.distance, // meters
        duration: route.duration, // seconds
        geometry: route.geometry,
        distanceKm: (route.distance / 1000).toFixed(2),
        durationMinutes: Math.ceil(route.duration / 60),
        origin: {
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: {
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
      };
    } catch (error) {
      logger.error({
        msg: "Directions error",
        error: (error as Error).message,
        origin,
        destination,
        status: (error as any).response?.status,
      });

      if ((error as any).response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if ((error as any).response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(
        `Failed to get directions: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Earth's radius in km
    const dLat = this._toRad(lat2 - lat1);
    const dLon = this._toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
        Math.cos(this._toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return parseFloat(distance.toFixed(2));
  }

  // Helper methods
  _generateSessionToken() {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  _toRad(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  _parseContext(context: any) {
    if (!context || !Array.isArray(context)) return {};

    const parsed: Record<string, string> = {};
    context.forEach((item: any) => {
      const [type] = item.id.split(".");
      parsed[type] = item.text;
    });
    return parsed;
  }
}

export default new AddressesService();
