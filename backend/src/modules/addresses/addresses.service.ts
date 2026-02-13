// services/backend/src/modules/addresses/addresses.service.ts
import axios from "axios";
import crypto from "node:crypto";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import { ValidationError } from "../../utils/error.util.js";

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
  limit?: number;
}

interface DirectionsOrigin {
  latitude: number;
  longitude: number;
}

interface DirectionsDestination {
  latitude: number;
  longitude: number;
}

// Cache for 1 hour with size limits to prevent DoS attacks
const searchCache = new NodeCache({
  stdTTL: 3600, // 1 hour
  maxKeys: 1000, // Maximum 1000 cached entries
  checkperiod: 600, // Check for expired keys every 10 minutes
});

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
   * Sanitize URLs for logging by removing sensitive information
   */
  private _sanitizeUrl(url: string): string {
    if (!url) return url;
    // Remove access_token and session_token parameters
    return url
      .replaceAll(/access_token=[^&]*/g, "access_token=***")
      .replaceAll(/session_token=[^&]*/g, "session_token=***");
  }

  /**
   * Sanitize user input strings to prevent injection attacks
   */
  private _sanitizeInput(input: string): string {
    if (typeof input !== "string") return "";

    // Remove potentially dangerous characters
    return (
      input
        .trim()
        // Remove null bytes and other control characters
        .replaceAll(/[\x00-\x1F\x7F-\x9F]/g, "")
        // Basic XSS prevention - remove script tags
        .replaceAll(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replaceAll(/<[^>]*>/g, "")
        // Limit length to prevent DoS
        .substring(0, 1000)
    );
  }

  /**
   * Search for places/addresses using Mapbox Search Box API
   * Returns suggestions (first step of two-step process)
   */
  async searchAddresses(searchParams: SearchParams): Promise<any> {
    // Sanitize and validate input first
    let sanitizedQuery = "";
    let sanitizedProximity: string | undefined;

    try {
      const {
        query,
        proximity = "72.8321,18.9582", // Mumbai coordinates as default
        limit = 7,
        types = "address,poi",
        country = "IN",
        language = "en",
      } = searchParams;

      // Sanitize and validate input
      sanitizedQuery = this._sanitizeInput(query);
      if (sanitizedQuery.length < 3) {
        throw new ValidationError("Query too short after sanitization");
      }
      if (sanitizedQuery.length > 256) {
        throw new ValidationError("Query too long for caching");
      }

      if (proximity) {
        sanitizedProximity = this._sanitizeInput(proximity);
        if (sanitizedProximity.length > 50) {
          throw new ValidationError("Proximity parameter too long");
        }
      }

      const cacheKey = `search:${sanitizedQuery}:${sanitizedProximity || "default"}`;
      const cached = searchCache.get(cacheKey);
      if (cached) {
        logger.info({
          msg: "Returning cached search results",
          query: sanitizedQuery,
        });
        return cached;
      }

      // Generate session token for this search session
      const sessionToken = this._generateSessionToken();

      // Call Mapbox Search Box API
      const response = await axios.get(
        `${this.baseUrl}/search/searchbox/v1/suggest`,
        {
          params: {
            q: sanitizedQuery,
            access_token: this.mapboxAccessToken,
            session_token: sessionToken,
            proximity: sanitizedProximity,
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
        // Note: Mapbox Search Box 'suggest' API does NOT return coordinates.
        // Coordinates are only available via the 'retrieve' endpoint using the session token.
        // We return empty/undefined coordinates here, which the frontend must handle.
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
        query: sanitizedQuery,
        resultCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error({
        msg: "Mapbox search error",
        error: (error as Error).message,
        query: sanitizedQuery || searchParams.query,
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

      // Parse context to get detailed address components
      const context = this._parseContext(feature.properties.context);

      // Build full address entirely from context components for consistency
      // Format: [Address], [Neighborhood], [Locality], [Place], [Postcode]
      const addressComponents: string[] = [];

      // 1. Start with the detailed address from context
      if (context.address) {
        addressComponents.push(context.address);
      }

      // 2. Add Neighborhood
      if (context.neighborhood) {
        addressComponents.push(context.neighborhood);
      }

      // 3. Add Locality (often same as city/place, but sometimes more specific)
      if (context.locality && context.locality !== context.place) {
        addressComponents.push(context.locality);
      }

      // 4. Add Place (City)
      if (context.place) {
        addressComponents.push(context.place);
      }

      // 5. Add Postcode
      if (context.postcode) {
        addressComponents.push(context.postcode);
      }

      // Filter out duplicates and empty strings
      const uniqueComponents = [...new Set(addressComponents)].filter(Boolean);

      // Build the full address from context components
      let fullAddress = uniqueComponents.join(", ");

      // Fallback to Mapbox's full_address only if context is completely empty
      if (!fullAddress) {
        fullAddress =
          feature.properties.full_address ||
          feature.properties.place_formatted ||
          feature.properties.name ||
          "";
      }

      return {
        id: feature.properties.mapbox_id,
        name: feature.properties.name,
        fullAddress: fullAddress,
        coordinates: {
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
        },
        context: context,
        featureType: feature.geometry.type,
        bbox: feature.bbox,
      };
    } catch (error) {
      logger.error({
        msg: "Mapbox retrieve error",
        error: (error as Error).message,
        // Don't log mapboxId for security
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

      let { longitude, latitude, types, limit = 5 } = geocodeParams;

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

      // Validate limit
      if (limit !== undefined && (limit < 1 || limit > 5)) {
        throw new ValidationError("Limit must be between 1 and 5");
      }

      // Round to 7 decimal places to avoid precision issues
      latitude = Math.round(latitude * 10000000) / 10000000;
      longitude = Math.round(longitude * 10000000) / 10000000;

      // Build reverse geocoding parameters for Mapbox Geocoding v6
      // According to Mapbox v6 docs:
      // - types can be comma-separated (e.g., "address,street,neighborhood")
      // - When limit > 1, exactly ONE type must be specified
      // - When limit = 1 (default), multiple types can be comma-separated
      // - proximity parameter is NOT supported for reverse geocoding (only forward)
      let requestTypes: string;
      if (types && types.length > 0) {
        if (limit > 1) {
          // When limit > 1, Mapbox requires exactly one type
          requestTypes = types[0] || "address";
        } else {
          // When limit = 1, multiple types can be comma-separated
          requestTypes = types.join(",");
        }
      } else if (limit > 1) {
        // Default: single type for limit > 1
        requestTypes = "address";
      } else {
        // Default: multiple types for limit = 1
        requestTypes = "address,street,neighborhood";
      }

      const params = new URLSearchParams({
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        access_token: this.mapboxAccessToken,
        types: requestTypes,
        limit: limit.toString(),
        language: "en",
        // Note: proximity is NOT supported for reverse geocoding in Mapbox v6
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
        url: this._sanitizeUrl(url),
        coordinates: { longitude, latitude },
        types: requestTypes,
      });

      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
        headers: {
          "User-Agent": "Shipzy-Backend/1.0",
        },
      });

      // Transform Mapbox v6 response to our format
      const features = response.data.features || [];

      const results = features.map((feature: any) => {
        // Mapbox v6: coordinates are in properties.coordinates object OR geometry.coordinates array
        let featureLatitude: number;
        let featureLongitude: number;

        if (feature.properties?.coordinates) {
          // v6 format: properties.coordinates = { longitude, latitude }
          featureLatitude = feature.properties.coordinates.latitude;
          featureLongitude = feature.properties.coordinates.longitude;
        } else if (
          feature.geometry?.coordinates &&
          Array.isArray(feature.geometry.coordinates)
        ) {
          // Fallback: geometry.coordinates = [longitude, latitude]
          featureLongitude = feature.geometry.coordinates[0];
          featureLatitude = feature.geometry.coordinates[1];
        } else {
          // Fallback to query coordinates if feature doesn't have coordinates
          featureLatitude = latitude;
          featureLongitude = longitude;
        }

        // Transform context object to array format - only include relevant context items
        // Mapbox v6 context is an object with keys like 'address', 'street', 'neighborhood', etc.
        const contextArray = feature.properties?.context
          ? Object.entries(feature.properties.context)
              .filter(([key]) => {
                // Only include relevant context types
                const relevantTypes = [
                  "address",
                  "street",
                  "neighborhood",
                  "locality",
                  "place",
                  "region",
                  "country",
                ];
                return relevantTypes.includes(key);
              })
              .map(([key, ctx]: [string, any]) => ({
                id: ctx?.mapbox_id || key,
                text: ctx?.name || key,
              }))
          : null;

        return {
          id: feature.id || feature.properties?.mapbox_id,
          name:
            feature.properties?.name ||
            feature.properties?.name_preferred ||
            "",
          fullAddress:
            feature.properties?.full_address ||
            feature.properties?.place_formatted ||
            "",
          placeName: feature.properties?.place_formatted || null,
          coordinates: {
            latitude: featureLatitude,
            longitude: featureLongitude,
          },
          featureType: feature.properties?.feature_type || "address",
          // Only include essential properties, not the entire raw object
          properties: feature.properties?.coordinates?.accuracy
            ? { accuracy: feature.properties.coordinates.accuracy }
            : null,
          context: contextArray,
          bbox: feature.bbox || null,
          relevance: feature.properties?.relevance || null,
        };
      });

      logger.info({
        msg: "Mapbox reverse geocoding completed",
        coordinates: { longitude, latitude },
        resultsCount: results.length,
      });

      return {
        coordinates: { latitude, longitude },
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
        // Don't log coordinates in errors for privacy
        status,
        url: this._sanitizeUrl(axiosError.config?.url),
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
        // Don't log coordinate data for privacy
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
   * Get distance matrix between two points using Mapbox Matrix API
   * Returns distance in meters and duration in seconds
   */
  async getDistanceMatrix(
    pickup: { lat: number; lng: number },
    drop: { lat: number; lng: number },
  ) {
    try {
      // Validate coordinates
      if (
        typeof pickup.lat !== "number" ||
        typeof pickup.lng !== "number" ||
        typeof drop.lat !== "number" ||
        typeof drop.lng !== "number"
      ) {
        throw new ValidationError("Invalid coordinate format");
      }

      if (
        pickup.lat < -90 ||
        pickup.lat > 90 ||
        drop.lat < -90 ||
        drop.lat > 90
      ) {
        throw new ValidationError("Latitude must be between -90 and 90");
      }

      if (
        pickup.lng < -180 ||
        pickup.lng > 180 ||
        drop.lng < -180 ||
        drop.lng > 180
      ) {
        throw new ValidationError("Longitude must be between -180 and 180");
      }

      // Format coordinates as required by Mapbox Matrix API: "lng,lat;lng,lat"
      const coordinates = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;

      // Call Mapbox Directions Matrix API
      const url = `${this.baseUrl}/directions-matrix/v1/mapbox/driving/${coordinates}`;

      logger.info({
        msg: "Calling Mapbox Matrix API",
        url: this._sanitizeUrl(url),
        pickup: { lat: pickup.lat, lng: pickup.lng },
        drop: { lat: drop.lat, lng: drop.lng },
      });

      const response = await axios.get(url, {
        params: {
          access_token: this.mapboxAccessToken,
          annotations: "distance",
        },
        timeout: 5000,
        headers: {
          "User-Agent": "Shipzy-Backend/1.0",
        },
      });

      // Extract distance and duration from response
      const distances = response.data.distances;

      if (!distances?.[0]?.[1]) {
        throw new ValidationError(
          "No route found between the specified points",
        );
      }

      const distanceInMeters = distances[0][1]; // Distance from point 0 to point 1

      const result = {
        distance: distanceInMeters, // meters
        distanceKm: Number.parseFloat((distanceInMeters / 1000).toFixed(2)),
        pickup: {
          latitude: pickup.lat,
          longitude: pickup.lng,
        },
        drop: {
          latitude: drop.lat,
          longitude: drop.lng,
        },
      };

      logger.info({
        msg: "Mapbox Matrix API call successful",
        distanceKm: result.distanceKm,
      });

      return result;
    } catch (error) {
      logger.error({
        msg: "Mapbox Matrix API error",
        error: (error as Error).message,
        status: (error as any).response?.status,
      });

      if ((error as any).response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if ((error as any).response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      if ((error as any).response?.status === 422) {
        throw new ValidationError(
          "Invalid coordinates - points may be too far apart or unreachable",
        );
      }

      throw new ValidationError(
        `Failed to calculate distance: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula - for reference only)
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

    return Number.parseFloat(distance.toFixed(2));
  }

  // Helper methods
  _generateSessionToken() {
    // Generate cryptographically secure random token
    const randomBytes = crypto.randomBytes(16);
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes.toString("hex");
    return `${timestamp}_${randomPart}`;
  }

  _toRad(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  _parseContext(context: any) {
    if (!context) return {};

    const parsed: Record<string, string> = {};

    if (Array.isArray(context)) {
      for (const item of context) {
        const [type] = item.id.split(".");
        parsed[type] = item.text;
      }
    } else if (typeof context === "object") {
      // Handle object format (e.g. from Retrieve API)
      for (const [key, value] of Object.entries(context)) {
        if (value && typeof value === "object" && "name" in value) {
          parsed[key] = (value as any).name;
        }
      }
    }
    return parsed;
  }
}

export default new AddressesService();
