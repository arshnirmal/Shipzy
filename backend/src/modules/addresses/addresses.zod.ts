// services/backend/src/modules/addresses/addresses.zod.ts
import { z } from "zod";
import { CoordinatesZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

export const ProximityZ = CoordinatesZ;

export const SearchAddressesZ = z
  .object({
    query: z.string().trim().min(2).max(256),
    proximity: ProximityZ.optional(),
    country: z
      .string()
      .regex(/^[A-Z]{2}(,[A-Z]{2})*$/)
      .optional(),
    types: z
      .array(
        z.enum([
          "address",
          "poi",
          "place",
          "neighborhood",
          "locality",
          "region",
          "country",
        ]),
      )
      .min(1)
      .optional(),
    limit: z.number().int().min(1).max(10).optional(),
  })
  .strict();
export type SearchAddresses = z.infer<typeof SearchAddressesZ>;

export const RetrievePlaceZ = z
  .object({
    mapboxId: z.string().min(1).max(200),
    sessionToken: z.string().min(1).max(200),
  })
  .strict();
export type RetrievePlace = z.infer<typeof RetrievePlaceZ>;

export const ReverseGeocodeZ = CoordinatesZ.extend({
  types: z
    .array(
      z.enum([
        "address",
        "poi",
        "place",
        "neighborhood",
        "locality",
        "region",
        "country",
      ]),
    )
    .min(1)
    .optional(),
  limit: z.number().int().min(1).max(5).optional(),
}).strict();
export type ReverseGeocode = z.infer<typeof ReverseGeocodeZ>;

export const DirectionsZ = z
  .object({
    origin: CoordinatesZ,
    destination: CoordinatesZ,
    profile: z.enum(["driving", "walking", "cycling"]).optional(),
  })
  .strict();
export type Directions = z.infer<typeof DirectionsZ>;

export const DistanceZ = z
  .object({
    lat1: z.number().min(-90).max(90),
    lon1: z.number().min(-180).max(180),
    lat2: z.number().min(-90).max(90),
    lon2: z.number().min(-180).max(180),
  })
  .strict();
export type Distance = z.infer<typeof DistanceZ>;

// ============================================================================
// RESPONSE SCHEMAS - API responses
// ============================================================================

export const AddressContextZ = z.record(
  z.string(),
  z.string().nullable().optional(),
);

export const BaseMapboxPlaceZ = z
  .object({
    mapboxId: z.string(),
    name: z.string(),
    fullAddress: z.string(),
    coordinates: CoordinatesZ.optional(),
    context: AddressContextZ.optional(),
  })
  .strict();

export const AddressSuggestionZ = BaseMapboxPlaceZ.extend({
  placeType: z.string(),
}).strict();
export type AddressSuggestion = z.infer<typeof AddressSuggestionZ>;

export const SearchAddressesResponseZ = z
  .object({
    search: z
      .object({
        query: z.string(),
        sessionToken: z.string(),
        suggestions: z.array(AddressSuggestionZ),
        total: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type SearchAddressesResponse = z.infer<typeof SearchAddressesResponseZ>;

export const PlaceDetailsZ = BaseMapboxPlaceZ.extend({
  featureType: z.string(),
  bbox: z.array(z.number()).nullable(),
}).strict();
export type PlaceDetails = z.infer<typeof PlaceDetailsZ>;

export const RetrievePlaceResponseZ = z
  .object({
    place: PlaceDetailsZ,
  })
  .strict();
export type RetrievePlaceResponse = z.infer<typeof RetrievePlaceResponseZ>;

export const ReverseGeocodeResultItemZ = BaseMapboxPlaceZ.extend({
  placeName: z.string().nullable(),
  featureType: z.string(),
  properties: z
    .object({
      accuracy: z.number(),
    })
    .nullable(),
  context: z
    .array(
      z
        .object({
          id: z.string(),
          text: z.string(),
        })
        .strict(),
    )
    .nullable(),
  bbox: z.array(z.number()).nullable(),
  relevance: z.number().nullable(),
}).strict();

export const ReverseGeocodeResponseZ = z
  .object({
    reverseGeocode: z
      .object({
        coordinates: CoordinatesZ,
        results: z.array(ReverseGeocodeResultItemZ),
        total: z.number().int().nonnegative(),
      })
      .strict(),
  })
  .strict();
export type ReverseGeocodeResponse = z.infer<typeof ReverseGeocodeResponseZ>;

export const DirectionsRouteZ = z
  .object({
    distanceMeters: z.number().nonnegative(),
    durationSeconds: z.number().nonnegative(),
    distanceKm: z.number().nonnegative(),
    durationMinutes: z.number().int().nonnegative(),
    geometry: z
      .object({
        type: z.literal("LineString"),
        coordinates: z.array(z.tuple([z.number(), z.number()])),
      })
      .strict(),
  })
  .strict();

export const DirectionsResponseZ = z
  .object({
    route: DirectionsRouteZ,
    navigation: z
      .object({
        origin: CoordinatesZ,
        destination: CoordinatesZ,
        profile: z.enum(["driving", "walking", "cycling"]),
      })
      .strict(),
  })
  .strict();
export type DirectionsResponse = z.infer<typeof DirectionsResponseZ>;

export const DistanceResponseZ = z
  .object({
    distance: z
      .object({
        kilometers: z.number().nonnegative(),
      })
      .strict(),
    points: z
      .object({
        origin: CoordinatesZ,
        destination: CoordinatesZ,
      })
      .strict(),
  })
  .strict();
export type DistanceResponse = z.infer<typeof DistanceResponseZ>;
