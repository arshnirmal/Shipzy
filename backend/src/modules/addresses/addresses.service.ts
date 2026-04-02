// services/backend/src/modules/addresses/addresses.service.ts
import crypto from "node:crypto";
import NodeCache from "node-cache";
import logger from "../../config/logger.js";
import config from "../../config/env.js";
import { AppError, ValidationError } from "../../utils/error.util.js";
import type { Coordinates } from "../../schemas/common.zod.js";
import addressesRepository, {
  MapboxFeatureRaw,
  MapboxSuggestionRaw,
} from "./addresses.repository.js";

interface SearchParams {
  query: string;
  proximity?: Coordinates;
  limit?: number;
  types?: string | string[];
  country?: string;
  language?: string;
}

interface GeocodeParams {
  latitude: number;
  longitude: number;
  types?: string[];
  limit?: number;
}

type SearchSuggestion = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeType: string;
  coordinates?: Coordinates;
  context: Record<string, string | undefined>;
  sessionToken: string;
};

type RetrieveResult = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  coordinates: Coordinates;
  context: Record<string, string | undefined>;
  featureType: string;
  bbox: number[] | null;
};

type ReverseGeocodeResultItem = {
  mapboxId: string;
  name: string;
  fullAddress: string;
  placeName: string | null;
  coordinates: Coordinates;
  featureType: string;
  properties: { accuracy: number } | null;
  context: Array<{ id: string; text: string }> | null;
  bbox: number[] | null;
  relevance: number | null;
};

const searchCache = new NodeCache({
  stdTTL: 3600,
  maxKeys: 1000,
  checkperiod: 600,
});

class AddressesService {
  private readonly mapboxAccessToken: string;

  constructor() {
    this.mapboxAccessToken = config.mapbox.accessToken;
    if (!this.mapboxAccessToken) {
      logger.warn(
        "MAPBOX_ACCESS_TOKEN not configured - address APIs will fail",
      );
    }
  }

  async searchAddresses(searchParams: SearchParams): Promise<SearchSuggestion[]> {
    if (!this.mapboxAccessToken) {
      throw new AppError("Address provider is not configured", 500);
    }

    const {
      query,
      proximity,
      limit = 7,
      types = ["address", "poi"],
      country,
      language = "en",
    } = searchParams;

    const normalizedQuery = this._normalizeText(query);
    if (normalizedQuery.length < 2) {
      throw new ValidationError("Query must be at least 2 characters");
    }

    const typesParam = Array.isArray(types) ? types.join(",") : types;
    const proximityParam = proximity
      ? `${proximity.longitude},${proximity.latitude}`
      : undefined;

    const cacheKey = `search:${normalizedQuery}:${proximityParam ?? ""}:${limit}:${typesParam}:${country ?? ""}:${language}`;
    const cached = searchCache.get(cacheKey) as SearchSuggestion[] | undefined;
    if (cached) {
      logger.info({
        msg: "Address search cache hit",
        query: normalizedQuery,
        resultCount: cached.length,
      });
      return cached;
    }

    try {
      const sessionToken = this._generateSessionToken();
      const suggestions = await addressesRepository.suggest({
        query: normalizedQuery,
        sessionToken,
        proximity: proximityParam,
        limit,
        types: typesParam,
        country,
        language,
      });

      const result = suggestions
        .map((item) => this._mapSuggestion(item, sessionToken))
        .filter((item): item is SearchSuggestion => item !== null);

      searchCache.set(cacheKey, result);

      logger.info({
        msg: "Address search completed",
        query: normalizedQuery,
        resultCount: result.length,
      });

      return result;
    } catch (error) {
      this._handleMapboxError(error, "address search");
    }
  }

  async retrievePlace(
    mapboxId: string,
    sessionToken: string,
  ): Promise<RetrieveResult> {
    if (!this.mapboxAccessToken) {
      throw new AppError("Address provider is not configured", 500);
    }

    try {
      const feature = await addressesRepository.retrieve(mapboxId, sessionToken);
      if (!feature) {
        throw new ValidationError("No place found for the selected location");
      }

      const context = this._parseContext(feature.properties?.context);
      const fullAddress = this._buildFullAddress(context, feature.properties);

      const coordinates = this._extractFeatureCoordinates(feature);
      if (!coordinates) {
        throw new ValidationError("Selected place has no valid coordinates");
      }

      return {
        mapboxId:
          this._asString(feature.properties?.mapbox_id) ||
          this._asString(feature.id) ||
          mapboxId,
        name: this._asString(feature.properties?.name) || "",
        fullAddress,
        coordinates,
        context,
        featureType: this._asString(feature.geometry?.type) || "Feature",
        bbox: Array.isArray(feature.bbox) ? feature.bbox : null,
      };
    } catch (error) {
      this._handleMapboxError(error, "place retrieval");
    }
  }

  async reverseGeocode(geocodeParams: GeocodeParams) {
    if (!this.mapboxAccessToken) {
      throw new AppError("Address provider is not configured", 500);
    }

    let { longitude, latitude, types, limit = 5 } = geocodeParams;

    if (limit < 1 || limit > 5) {
      throw new ValidationError("Limit must be between 1 and 5");
    }

    latitude = Math.round(latitude * 10000000) / 10000000;
    longitude = Math.round(longitude * 10000000) / 10000000;

    const requestTypes = this._resolveReverseTypes(types, limit);

    try {
      const features = await addressesRepository.reverseGeocode({
        latitude,
        longitude,
        types: requestTypes,
        limit,
        language: "en",
      });

      const results: ReverseGeocodeResultItem[] = features.map((feature) =>
        this._mapReverseFeature(feature, latitude, longitude),
      );

      logger.info({
        msg: "Reverse geocoding completed",
        types: requestTypes,
        limit,
        resultCount: results.length,
      });

      return {
        coordinates: { latitude, longitude },
        results,
        total: results.length,
      };
    } catch (error) {
      this._handleMapboxError(error, "reverse geocoding");
    }
  }

  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    profile: "driving" | "walking" | "cycling" = "driving",
  ) {
    if (!this.mapboxAccessToken) {
      throw new AppError("Address provider is not configured", 500);
    }

    const coords = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`;

    try {
      const route = await addressesRepository.directions(profile, coords);
      if (!route) {
        throw new ValidationError("No route found between the specified points");
      }

      const distance =
        typeof route.distance === "number" ? route.distance : Number.NaN;
      const duration =
        typeof route.duration === "number" ? route.duration : Number.NaN;

      if (!Number.isFinite(distance) || !Number.isFinite(duration)) {
        throw new AppError("Invalid route payload from address provider", 502);
      }

      return {
        distance,
        duration,
        geometry: route.geometry,
        distanceKm: Number.parseFloat((distance / 1000).toFixed(2)),
        durationMinutes: Math.ceil(duration / 60),
        origin,
        destination,
      };
    } catch (error) {
      this._handleMapboxError(error, "directions");
    }
  }

  async getDistanceMatrix(
    pickup: { lat: number; lng: number },
    drop: { lat: number; lng: number },
  ) {
    if (!this.mapboxAccessToken) {
      throw new AppError("Address provider is not configured", 500);
    }

    if (
      !Number.isFinite(pickup.lat) ||
      !Number.isFinite(pickup.lng) ||
      !Number.isFinite(drop.lat) ||
      !Number.isFinite(drop.lng)
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

    const coordinates = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;

    try {
      const distanceInMeters =
        await addressesRepository.distanceMatrix(coordinates);

      if (
        typeof distanceInMeters !== "number" ||
        !Number.isFinite(distanceInMeters)
      ) {
        throw new ValidationError("No route found between the specified points");
      }

      const result = {
        distance: distanceInMeters,
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
        msg: "Distance matrix completed",
        distanceKm: result.distanceKm,
      });

      return result;
    } catch (error) {
      this._handleMapboxError(error, "distance matrix");
    }
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371;
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

  private _normalizeText(input: string): string {
    return input.trim().replaceAll(/\s+/g, " ");
  }

  private _buildFullAddress(
    context: Record<string, string | undefined>,
    properties?: Record<string, unknown>,
  ): string {
    const parts: string[] = [];
    if (context.address) parts.push(context.address);
    if (context.neighborhood) parts.push(context.neighborhood);
    if (context.locality && context.locality !== context.place) {
      parts.push(context.locality);
    }
    if (context.place) parts.push(context.place);
    if (context.postcode) parts.push(context.postcode);

    const fromContext = [...new Set(parts)].filter(Boolean).join(", ");
    if (fromContext) return fromContext;

    return (
      this._asString(properties?.full_address) ||
      this._asString(properties?.place_formatted) ||
      this._asString(properties?.name) ||
      ""
    );
  }

  private _resolveReverseTypes(types: string[] | undefined, limit: number): string {
    if (types && types.length > 0) {
      return limit > 1 ? (types[0] || "address") : types.join(",");
    }

    return limit > 1 ? "address" : "address,neighborhood,place";
  }

  private _mapSuggestion(
    item: MapboxSuggestionRaw,
    sessionToken: string,
  ): SearchSuggestion | null {
    const mapboxId = this._asString(item.mapbox_id);
    if (!mapboxId) return null;

    return {
      mapboxId,
      name: this._asString(item.name) || "",
      fullAddress:
        this._asString(item.full_address) ||
        this._asString(item.place_formatted) ||
        "",
      placeType: this._asString(item.feature_type) || "address",
      coordinates:
        typeof item.coordinates?.latitude === "number" &&
        typeof item.coordinates?.longitude === "number"
          ? {
              latitude: item.coordinates.latitude,
              longitude: item.coordinates.longitude,
            }
          : undefined,
      context: this._parseContext(item.context),
      sessionToken,
    };
  }

  private _mapReverseFeature(
    feature: MapboxFeatureRaw,
    fallbackLatitude: number,
    fallbackLongitude: number,
  ): ReverseGeocodeResultItem {
    const extracted = this._extractFeatureCoordinates(feature);
    const coordinates = extracted || {
      latitude: fallbackLatitude,
      longitude: fallbackLongitude,
    };

    const contextArray = this._contextAsArray(feature.properties?.context);
    const featureProperties = feature.properties as Record<string, unknown>;
    const mapboxId =
      this._asString(feature.id) ||
      this._asString(featureProperties?.mapbox_id) ||
      "";

    return {
      mapboxId,
      name:
        this._asString(featureProperties?.name) ||
        this._asString(featureProperties?.name_preferred) ||
        "",
      fullAddress:
        this._asString(featureProperties?.full_address) ||
        this._asString(featureProperties?.place_formatted) ||
        "",
      placeName: this._asString(featureProperties?.place_formatted) || null,
      coordinates,
      featureType: this._asString(featureProperties?.feature_type) || "address",
      properties: this._extractAccuracy(featureProperties),
      context: contextArray,
      bbox: Array.isArray(feature.bbox) ? feature.bbox : null,
      relevance:
        typeof featureProperties?.relevance === "number"
          ? featureProperties.relevance
          : null,
    };
  }

  private _extractFeatureCoordinates(
    feature: MapboxFeatureRaw,
  ): Coordinates | null {
    const properties = feature.properties as Record<string, unknown>;
    if (properties?.coordinates && typeof properties.coordinates === "object") {
      const c = properties.coordinates as Record<string, unknown>;
      if (typeof c.latitude === "number" && typeof c.longitude === "number") {
        return { latitude: c.latitude, longitude: c.longitude };
      }
    }

    if (
      Array.isArray(feature.geometry?.coordinates) &&
      typeof feature.geometry?.coordinates[0] === "number" &&
      typeof feature.geometry?.coordinates[1] === "number"
    ) {
      return {
        latitude: feature.geometry.coordinates[1]!,
        longitude: feature.geometry.coordinates[0]!,
      };
    }

    return null;
  }

  private _extractAccuracy(
    properties: Record<string, unknown>,
  ): { accuracy: number } | null {
    const coords = properties.coordinates;
    if (!coords || typeof coords !== "object") return null;

    const accuracy = (coords as Record<string, unknown>).accuracy;
    return typeof accuracy === "number" ? { accuracy } : null;
  }

  private _contextAsArray(
    context: unknown,
  ): Array<{ id: string; text: string }> | null {
    if (!context || typeof context !== "object" || Array.isArray(context)) {
      return null;
    }

    const relevantTypes = new Set([
      "address",
      "street",
      "neighborhood",
      "locality",
      "place",
      "region",
      "country",
    ]);

    return Object.entries(context as Record<string, unknown>)
      .filter(([key]) => relevantTypes.has(key))
      .map(([key, value]) => {
        const entry = value as Record<string, unknown>;
        return {
          id: this._asString(entry?.mapbox_id) || key,
          text: this._asString(entry?.name) || key,
        };
      });
  }

  private _parseContext(context: unknown): Record<string, string | undefined> {
    const parsed: Record<string, string | undefined> = {};

    if (Array.isArray(context)) {
      for (const item of context as Array<Record<string, unknown>>) {
        const id = this._asString(item.id);
        const text = this._asString(item.text);
        if (!id || !text) continue;
        const key = id.split(".")[0];
        if (key) parsed[key] = text;
      }
      return parsed;
    }

    if (context && typeof context === "object") {
      for (const [key, value] of Object.entries(
        context as Record<string, unknown>,
      )) {
        if (!value || typeof value !== "object") continue;
        const name = this._asString((value as Record<string, unknown>).name);
        if (name) parsed[key] = name;
      }
    }

    return parsed;
  }

  private _asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
  }

  private _generateSessionToken() {
    const randomBytes = crypto.randomBytes(16);
    const timestamp = Date.now().toString(36);
    const randomPart = randomBytes.toString("hex");
    return `${timestamp}_${randomPart}`;
  }

  private _toRad(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  private _handleMapboxError(error: unknown, operation: string): never {
    if (error instanceof AppError) {
      throw error;
    }

    const axiosError = error as {
      message?: string;
      response?: { status?: number; data?: any };
    };
    const status = axiosError.response?.status;
    const providerMessage =
      typeof axiosError.response?.data === "string"
        ? axiosError.response.data
        : axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          axiosError.message ||
          "Unknown upstream error";

    logger.error({
      msg: `Mapbox ${operation} failed`,
      status,
      error: providerMessage,
    });

    if (status === 400 || status === 422) {
      throw new ValidationError(`Invalid ${operation} parameters`);
    }
    if (status === 429) {
      throw new AppError("Address provider rate limited. Try again shortly", 503);
    }
    if (status === 401 || status === 403) {
      throw new AppError("Address provider authentication failed", 502);
    }

    throw new AppError(`Address provider error during ${operation}`, 502);
  }
}

export default new AddressesService();
