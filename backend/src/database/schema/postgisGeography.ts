// PostGIS geography(Point,4326) for Drizzle.
// drizzle-kit treats only a fixed whitelist as unquoted SQL types; "geography" is not listed,
// so generated migrations would emit invalid `"geography(POINT, 4326)"`. Scripts/db-generate-migration
// post-processes *.sql to strip those quotes after `drizzle-kit generate`.

import { customType } from "drizzle-orm/pg-core";

export const geographyPoint4326 = customType<{ data: { lat: number; lng: number } }>({
  dataType: () => "geography(POINT, 4326)",
});
