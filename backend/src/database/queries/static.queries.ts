// services/backend/src/database/queries/static.queries.ts

export default {
  /**
   * Get all delivery types with supported vehicles/weight tiers
   */
  GET_DELIVERY_TYPES: `
    WITH dt AS (
      SELECT
        dt.delivery_type_id,
        dt.name,
        dt.display_name,
        dt.description,
        dt.base_rate,
        dt.per_km_rate,
        dt.sort_order,
        dt.is_active
      FROM public.delivery_types dt
      WHERE dt.is_active = TRUE
    ),
      active_dtc_dedup AS (
        SELECT DISTINCT ON (dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id)
          dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id
        FROM public.delivery_type_capabilities dtc
        WHERE dtc.is_active = TRUE
        ORDER BY dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id
      ),
      vehicle_weight_tiers AS (
        SELECT
          a.delivery_type_id,
          vc.category_id,
          vc.name,
          vc.display_name,
          vc.max_weight_kg,
          vc.icon_url,
          jsonb_agg(
            jsonb_build_object(
              'tierId', wt.tier_id,
              'name', wt.name::text,
              'minWeightKg', wt.min_weight_kg,
              'maxWeightKg', wt.max_weight_kg,
              'additionalCharge', wt.additional_charge
            )
            ORDER BY wt.min_weight_kg
          ) AS weight_tiers
        FROM active_dtc_dedup a
        JOIN public.vehicle_categories vc
          ON vc.category_id = a.vehicle_category_id
         AND vc.is_active = TRUE
        JOIN public.weight_tiers wt
          ON wt.tier_id = a.weight_tier_id
        GROUP BY
          a.delivery_type_id,
          vc.category_id, vc.name, vc.display_name, vc.max_weight_kg, vc.icon_url
      ),
      vehicles AS (
        SELECT
          vwt.delivery_type_id,
          jsonb_agg(
            jsonb_build_object(
              'categoryId', vwt.category_id,
              'name', vwt.name::text,
              'displayName', vwt.display_name::text,
              'maxWeightKg', vwt.max_weight_kg,
              'iconUrl', vwt.icon_url::text,
              'weightTiers', vwt.weight_tiers
            )
            ORDER BY vwt.max_weight_kg
          ) AS supported_vehicles
        FROM vehicle_weight_tiers vwt
        GROUP BY vwt.delivery_type_id
      )
      SELECT
        d.delivery_type_id AS "deliveryTypeId",
        d.name,
        d.display_name AS "displayName",
        d.description,
        COALESCE(d.base_rate, 0) AS "baseRate",
        COALESCE(d.per_km_rate, 0) AS "perKmRate",
        COALESCE(d.sort_order, 0) AS "sortOrder",
        COALESCE(d.is_active, false) AS "isActive",
        COALESCE(v.supported_vehicles, '[]'::jsonb) AS "supportedVehicles"
      FROM dt d
      LEFT JOIN vehicles v ON v.delivery_type_id = d.delivery_type_id
      ORDER BY d.sort_order;
    `,

  /**
   * Get single delivery type by ID
   */
  GET_DELIVERY_TYPE_BY_ID: `
    SELECT
      delivery_type_id AS "deliveryTypeId",
      name AS "name",
      description AS "description",
      base_rate AS "baseRate",
      per_km_rate AS "perKmRate",
      is_active AS "isActive"
    FROM public.delivery_types
    WHERE delivery_type_id = $1
        AND is_active = true
    `,

  /**
   * Get all weight tiers
   */
  GET_WEIGHT_TIERS: `
    SELECT
        tier_id AS "tierId",
        name AS "name",
        min_weight_kg AS "minWeightKg",
        max_weight_kg AS "maxWeightKg",
        additional_charge AS "additionalCharge"
    FROM public.weight_tiers
    ORDER BY min_weight_kg ASC
    `,

  /**
   * Get all order statuses
   */
  GET_ORDER_STATUSES: `
    SELECT status::text AS "name"
    FROM unnest(enum_range(NULL::order_status)) AS status
  `,

  /**
   * Get all assignment statuses
   */
  GET_ASSIGNMENT_STATUSES: `
    SELECT status::text AS "name"
    FROM unnest(enum_range(NULL::assignment_status)) AS status
  `,

  /**
   * Get weight tier for specific weight
   */
  GET_WEIGHT_TIER_FOR_WEIGHT: `
    SELECT
      tier_id AS "tierId",
      name AS "name",
      min_weight_kg AS "minWeightKg",
      max_weight_kg AS "maxWeightKg",
      additional_charge AS "additionalCharge"
    FROM public.weight_tiers
    WHERE $1 >= min_weight_kg
        AND $1 < max_weight_kg
    LIMIT 1
    `,

  /**
   * Get all vehicle categories
   */
  GET_VEHICLE_CATEGORIES: `
      SELECT
        category_id AS "categoryId",
        name AS "name",
        display_name AS "displayName",
        description AS "description",
        max_weight_kg AS "maxWeightKg",
        icon_url AS "iconUrl",
        is_active AS "isActive"
      FROM public.vehicle_categories
      WHERE is_active = TRUE
      ORDER BY max_weight_kg ASC
    `,

  /**
   * Get all package types
   */
  GET_PACKAGE_TYPES: `
      SELECT
        package_type_id AS "packageTypeId",
        name AS "name",
        description AS "description"
      FROM public.package_types
      ORDER BY name ASC
    `,

  /**
   * Get all payment methods
   */
  GET_PAYMENT_METHODS: `
      SELECT
        method_id AS "methodId",
        name AS "name",
        description AS "description",
        is_active AS "isActive"
      FROM payments.payment_methods
      WHERE is_active = TRUE
      ORDER BY method_id ASC
    `,

  /**
   * Get all static data for order creation in a single query (ALTERNATIVE: combined version)
   */
  GET_CREATE_ORDER_DATA: `
      WITH dt AS (
        SELECT
          dt.delivery_type_id,
          dt.name,
          dt.display_name,
          dt.description,
          COALESCE(dt.base_rate, 0) AS base_rate,
          COALESCE(dt.per_km_rate, 0) AS per_km_rate,
          COALESCE(dt.sort_order, 0) AS sort_order,
          COALESCE(dt.is_active, false) AS is_active
        FROM public.delivery_types dt
        WHERE dt.is_active = TRUE
      ),
      active_dtc_dedup AS (
        SELECT DISTINCT ON (dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id)
          dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id
        FROM public.delivery_type_capabilities dtc
        WHERE dtc.is_active = TRUE
        ORDER BY dtc.delivery_type_id, dtc.vehicle_category_id, dtc.weight_tier_id
      ),
      vehicle_weight_tiers AS (
        SELECT
          a.delivery_type_id,
          vc.category_id,
          vc.name,
          vc.display_name,
          vc.max_weight_kg,
          vc.icon_url,
          jsonb_agg(
            jsonb_build_object(
              'tierId', wt.tier_id,
              'name', wt.name::text,
              'minWeightKg', wt.min_weight_kg,
              'maxWeightKg', wt.max_weight_kg,
              'additionalCharge', wt.additional_charge
            )
            ORDER BY wt.min_weight_kg
          ) AS weight_tiers
        FROM active_dtc_dedup a
        JOIN public.vehicle_categories vc
          ON vc.category_id = a.vehicle_category_id
         AND vc.is_active = TRUE
        JOIN public.weight_tiers wt
          ON wt.tier_id = a.weight_tier_id
        GROUP BY
          a.delivery_type_id,
          vc.category_id, vc.name, vc.display_name, vc.max_weight_kg, vc.icon_url
      ),
      vehicles AS (
        SELECT
          vwt.delivery_type_id,
          jsonb_agg(
            jsonb_build_object(
              'categoryId', vwt.category_id,
              'name', vwt.name::text,
              'displayName', vwt.display_name::text,
              'maxWeightKg', vwt.max_weight_kg,
              'iconUrl', vwt.icon_url::text,
              'weightTiers', vwt.weight_tiers
            )
            ORDER BY vwt.max_weight_kg
          ) AS supported_vehicles
        FROM vehicle_weight_tiers vwt
        GROUP BY vwt.delivery_type_id
      ),
      package_types_data AS (
        SELECT
          jsonb_agg(
            jsonb_build_object(
              'packageTypeId', pt.package_type_id,
              'name', pt.name::text,
              'description', pt.description::text
            )
            ORDER BY pt.name
          ) AS package_types
        FROM public.package_types pt
      ),
      payment_methods_data AS (
        SELECT
          jsonb_agg(
            jsonb_build_object(
              'methodId', pm.method_id,
              'name', pm.name::text,
              'displayName', pm.name::text,
              'description', pm.description::text,
              'isActive', pm.is_active
            )
            ORDER BY pm.method_id
          ) AS payment_methods
        FROM payments.payment_methods pm
        WHERE pm.is_active = TRUE
      )
      SELECT json_build_object(
        'deliveryTypes',
        (
          SELECT json_agg(
            jsonb_build_object(
              'deliveryTypeId', d.delivery_type_id,
              'name', d.name::text,
              'displayName', d.display_name::text,
              'description', d.description::text,
              'baseRate', d.base_rate,
              'perKmRate', d.per_km_rate,
              'sortOrder', d.sort_order,
              'isActive', d.is_active,
              'supportedVehicles', COALESCE(v.supported_vehicles, '[]'::jsonb)
            )
            ORDER BY d.sort_order
          )
          FROM dt d
          LEFT JOIN vehicles v ON v.delivery_type_id = d.delivery_type_id
        ),
        'packageTypes', (SELECT package_types FROM package_types_data),
        'paymentMethods', (SELECT payment_methods FROM payment_methods_data)
      ) AS data;
    `,
};
