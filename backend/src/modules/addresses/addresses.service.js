// services/backend/src/modules/addresses/addresses.service.js
import axios from "axios";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import { ValidationError } from "../../utils/error.util.js";

// Cache for 1 hour (reduce API calls)
const searchCache = new NodeCache({ stdTTL: 3600 });

class AddressesService {
  constructor() {
    this.mapboxAccessToken = process.env.MAPBOX_ACCESS_TOKEN;
    this.baseUrl = "https://api.mapbox.com";

    if (!this.mapboxAccessToken) {
      throw new Error("MAPBOX_ACCESS_TOKEN environment variable is required");
    }
  }

  /**
   * Search for places/addresses using Mapbox Search Box API
   * Returns suggestions (first step of two-step process)
   */
  async searchAddresses(searchParams) {
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
        logger.info("Returning cached search results", { query });
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

      const suggestions = response.data.suggestions.map((item) => ({
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

      logger.info("Mapbox search completed", {
        query,
        resultCount: suggestions.length,
      });

      return suggestions;
    } catch (error) {
      logger.error("Mapbox search error", {
        error: error.message,
        query: searchParams.query,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if (error.response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(`Address search failed: ${error.message}`);
    }
  }

  /**
   * Retrieve full details for a selected place
   */
  async retrievePlace(mapboxId, sessionToken) {
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
      logger.error("Mapbox retrieve error", {
        error: error.message,
        mapboxId,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if (error.response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(
        `Failed to retrieve place details: ${error.message}`,
      );
    }
  }

  /**
   * Reverse geocode coordinates to address using Mapbox Geocoding API
   */
  async reverseGeocode(geocodeParams) {
    try {
      const { longitude, latitude, types } = geocodeParams;

      // Build reverse geocoding parameters
      const params = new URLSearchParams({
        access_token: this.mapboxAccessToken,
        types: types
          ? types.join(",")
          : "address,poi,place,neighborhood,locality",
        limit: "5",
        language: "en",
      });

      const url = `${this.baseUrl}/geocoding/v5/mapbox.places/${longitude},${latitude}.json?${params.toString()}`;

      logger.info("Making Mapbox Reverse Geocoding API request", {
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

      const results = features.map((feature) => ({
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

      logger.info("Mapbox reverse geocoding completed", {
        coordinates: { longitude, latitude },
        resultsCount: results.length,
      });

      return {
        coordinates: { longitude, latitude },
        results,
        total: results.length,
      };
    } catch (error) {
      logger.error("Mapbox reverse geocoding failed", {
        error: error.message,
        coordinates: {
          longitude: geocodeParams.longitude,
          latitude: geocodeParams.latitude,
        },
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if (error.response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(`Reverse geocoding failed: ${error.message}`);
    }
  }

  /**
   * Get directions between two points using Mapbox Directions API
   */
  async getDirections(origin, destination, profile = "driving") {
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
      logger.error("Directions error", {
        error: error.message,
        origin,
        destination,
        status: error.response?.status,
      });

      if (error.response?.status === 401) {
        throw new ValidationError("Invalid Mapbox API key");
      }

      if (error.response?.status === 429) {
        throw new ValidationError("Mapbox API rate limit exceeded");
      }

      throw new ValidationError(`Failed to get directions: ${error.message}`);
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
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

  _toRad(degrees) {
    return degrees * (Math.PI / 180);
  }

  _parseContext(context) {
    if (!context) return {};

    const parsed = {};
    context.forEach((item) => {
      const [type] = item.id.split(".");
      parsed[type] = item.text;
    });
    return parsed;
  }
}

export default new AddressesService();
