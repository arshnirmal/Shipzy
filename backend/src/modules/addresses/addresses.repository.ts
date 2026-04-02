// services/backend/src/modules/addresses/addresses.repository.ts
import axios, { AxiosInstance } from "axios";
import config from "../../config/env.js";

export interface MapboxSuggestionRaw {
  mapbox_id?: string;
  name?: string;
  full_address?: string;
  place_formatted?: string;
  feature_type?: string;
  coordinates?: { latitude?: number; longitude?: number };
  context?: unknown;
}

export interface MapboxFeatureRaw {
  id?: string;
  properties?: Record<string, unknown>;
  geometry?: {
    type?: string;
    coordinates?: number[];
  };
  bbox?: number[] | null;
}

type SuggestParams = {
  query: string;
  sessionToken: string;
  proximity?: string;
  limit?: number;
  types?: string;
  country?: string;
  language?: string;
};

class AddressesRepository {
  private readonly mapboxAccessToken: string;
  private readonly client: AxiosInstance;

  constructor() {
    this.mapboxAccessToken = config.mapbox.accessToken;
    this.client = axios.create({
      baseURL: config.mapbox.baseUrl,
      timeout: 5000,
      headers: {
        "User-Agent": "Shipzy-Backend/1.0",
      },
    });
  }

  async suggest(params: SuggestParams): Promise<MapboxSuggestionRaw[]> {
    const response = await this.client.get("/search/searchbox/v1/suggest", {
      params: {
        q: params.query,
        access_token: this.mapboxAccessToken,
        session_token: params.sessionToken,
        proximity: params.proximity,
        limit: params.limit,
        types: params.types,
        country: params.country,
        language: params.language,
      },
    });

    return response.data?.suggestions ?? [];
  }

  async retrieve(
    mapboxId: string,
    sessionToken: string,
  ): Promise<MapboxFeatureRaw | null> {
    const response = await this.client.get(
      `/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`,
      {
        params: {
          access_token: this.mapboxAccessToken,
          session_token: sessionToken,
        },
      },
    );

    return response.data?.features?.[0] ?? null;
  }

  async reverseGeocode(params: {
    latitude: number;
    longitude: number;
    types: string;
    limit: number;
    language?: string;
  }): Promise<MapboxFeatureRaw[]> {
    const response = await this.client.get("/search/geocode/v6/reverse", {
      params: {
        longitude: params.longitude,
        latitude: params.latitude,
        access_token: this.mapboxAccessToken,
        types: params.types,
        limit: params.limit,
        language: params.language || "en",
      },
    });

    return response.data?.features ?? [];
  }

  async directions(
    profile: "driving" | "walking" | "cycling",
    coords: string,
  ): Promise<Record<string, unknown> | null> {
    const response = await this.client.get(
      `/directions/v5/mapbox/${profile}/${coords}`,
      {
        params: {
          access_token: this.mapboxAccessToken,
          geometries: "geojson",
          overview: "full",
          steps: false,
        },
      },
    );

    return response.data?.routes?.[0] ?? null;
  }

  async distanceMatrix(coordinates: string): Promise<number | null> {
    const response = await this.client.get(
      `/directions-matrix/v1/mapbox/driving/${coordinates}`,
      {
        params: {
          access_token: this.mapboxAccessToken,
          annotations: "distance",
        },
      },
    );

    return response.data?.distances?.[0]?.[1] ?? null;
  }
}

export default new AddressesRepository();
