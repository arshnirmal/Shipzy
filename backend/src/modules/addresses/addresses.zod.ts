// services/backend/src/modules/addresses/addresses.zod.ts
import { z } from "zod";

export const ProximityZ = z.object({
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
});

export const SearchAddressesZ = z.object({
  query: z.string().min(1).max(256),
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
    .optional(),
  limit: z.number().int().min(1).max(10).optional(),
});
export type SearchAddresses = z.infer<typeof SearchAddressesZ>;

export const RetrievePlaceZ = z.object({
  mapboxId: z.string().min(1).max(200),
  sessionToken: z.string().min(1).max(200),
});
export type RetrievePlace = z.infer<typeof RetrievePlaceZ>;

export const ReverseGeocodeZ = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
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
    .optional(),
});
export type ReverseGeocode = z.infer<typeof ReverseGeocodeZ>;

export const DirectionsZ = z.object({
  origin: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  destination: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  profile: z.enum(["driving", "walking", "cycling"]).optional(),
});
export type Directions = z.infer<typeof DirectionsZ>;

export const DistanceZ = z.object({
  lat1: z.number().min(-90).max(90),
  lon1: z.number().min(-180).max(180),
  lat2: z.number().min(-90).max(90),
  lon2: z.number().min(-180).max(180),
});
export type Distance = z.infer<typeof DistanceZ>;
