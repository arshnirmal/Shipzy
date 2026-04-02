// services/backend/src/modules/addresses/addresses.zod.ts
import { z } from "zod";
import { CoordinatesZ, BaseAddressZ } from "../../schemas/common.zod.js";

// ============================================================================
// REQUEST SCHEMAS - API request payloads
// ============================================================================

export const ProximityZ = CoordinatesZ;

export const SearchAddressesZ = z.object({
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
}).strict();
export type SearchAddresses = z.infer<typeof SearchAddressesZ>;

export const RetrievePlaceZ = z.object({
  mapboxId: z.string().min(1).max(200),
  sessionToken: z.string().min(1).max(200),
}).strict();
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
})
  .strict();
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

export const AddressSuggestionZ = z.object({
  mapboxId: z.string(),
  name: z.string(),
  fullAddress: z.string(),
  placeType: z.string(),
  coordinates: CoordinatesZ.optional(),
});
export type AddressSuggestion = z.infer<typeof AddressSuggestionZ>;

export const PlaceDetailsZ = BaseAddressZ.extend({
  mapboxId: z.string(),
  placeType: z.string(),
});
export type PlaceDetails = z.infer<typeof PlaceDetailsZ>;

export const DirectionsResponseZ = z.object({
  distance: z.number().nonnegative(),
  duration: z.number().nonnegative(),
  geometry: z.object({
    type: z.literal("LineString"),
    coordinates: z.array(z.tuple([z.number(), z.number()])),
  }),
});
export type DirectionsResponse = z.infer<typeof DirectionsResponseZ>;
