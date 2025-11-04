// services/backend/src/database/queries/static.queries.js

/**
 * Static data queries for delivery types, weight tiers, vehicle categories, etc.
 */

export default {
  // ============ DELIVERY TYPES ============

  /**
   * Get all active delivery types with pricing
   */
  GET_DELIVERY_TYPES: `
        SELECT
            dt.delivery_type_id,
            dt.name,
            dt.description,
            dt.base_rate,
            dt.per_km_rate,
            dt.estimated_time_minutes,
            dt.is_active,

            -- Get supported weight tiers
            COALESCE(
                json_agg(
                    json_build_object(
                        'tier_id', wt.tier_id,
                        'name', wt.name,
                        'min_weight_kg', wt.min_weight_kg,
                        'max_weight_kg', wt.max_weight_kg,
                        'additional_charge', wt.additional_charge
                    ) ORDER BY wt.min_weight_kg
                ) FILTER (WHERE wt.tier_id IS NOT NULL),
                '[]'::json
            ) AS supported_weight_tiers,

            -- Get applicable labels/tags
            COALESCE(
                json_agg(
                    DISTINCT jsonb_build_object(
                        'label_id', l.label_id,
                        'name', l.name,
                        'icon', l.icon
                    )
                ) FILTER (WHERE l.label_id IS NOT NULL),
                '[]'::json
            ) AS labels

        FROM public.delivery_types dt
        LEFT JOIN public.delivery_type_capabilities dtc ON dt.delivery_type_id = dtc.delivery_type_id
        LEFT JOIN public.weight_tiers wt ON dtc.weight_tier_id = wt.tier_id
        LEFT JOIN public.delivery_type_labels dtl ON dt.delivery_type_id = dtl.delivery_type_id
        LEFT JOIN public.labels l ON dtl.label_id = l.label_id
        WHERE dt.is_active = true
        GROUP BY dt.delivery_type_id
        ORDER BY dt.base_rate ASC
    `,

  /**
   * Get single delivery type by ID
   */
  GET_DELIVERY_TYPE_BY_ID: `
        SELECT
            delivery_type_id,
            name,
            description,
            base_rate,
            per_km_rate,
            estimated_time_minutes,
            is_active
        FROM public.delivery_types
        WHERE delivery_type_id = $1
            AND is_active = true
    `,

  // ============ WEIGHT TIERS ============

  /**
   * Get all weight tiers
   */
  GET_WEIGHT_TIERS: `
        SELECT
            tier_id,
            name,
            min_weight_kg,
            max_weight_kg,
            additional_charge
        FROM public.weight_tiers
        ORDER BY min_weight_kg ASC
    `,

  /**
   * Get weight tier for specific weight
   */
  GET_WEIGHT_TIER_FOR_WEIGHT: `
        SELECT
            tier_id,
            name,
            min_weight_kg,
            max_weight_kg,
            additional_charge
        FROM public.weight_tiers
        WHERE $1 >= min_weight_kg
            AND $1 < max_weight_kg
        LIMIT 1
    `,

  // ============ VEHICLE CATEGORIES ============

  /**
   * Get all vehicle categories
   */
  GET_VEHICLE_CATEGORIES: `
        SELECT
            category_id,
            name,
            description,
            max_weight_kg,
            icon
        FROM public.vehicle_categories
        ORDER BY max_weight_kg ASC
    `,

  /**
   * Get vehicle categories for delivery type
   */
  GET_VEHICLE_CATEGORIES_FOR_DELIVERY_TYPE: `
        SELECT DISTINCT
            vc.category_id,
            vc.name,
            vc.description,
            vc.max_weight_kg,
            vc.icon
        FROM public.vehicle_categories vc
        JOIN public.courier_vehicles cv ON vc.category_id = cv.category_id
        WHERE cv.is_active = true
        ORDER BY vc.max_weight_kg ASC
    `,

  // ============ PACKAGE TYPES (LABELS) ============

  /**
   * Get all package type labels
   */
  GET_PACKAGE_TYPES: `
        SELECT
            package_type_id,
            name,
            description,
            icon
        FROM public.package_types
        ORDER BY name ASC
    `,

  /**
   * Get all labels (for categorization)
   */
  GET_LABELS: `
        SELECT
            label_id,
            name,
            icon,
            color
        FROM public.labels
        ORDER BY name ASC
    `,

  // ============ PAYMENT METHODS ============

  /**
   * Get all active payment methods
   */
  GET_PAYMENT_METHODS: `
        SELECT
            method_id,
            name,
            display_name,
            description,
            is_active
        FROM public.payment_methods
        WHERE is_active = true
        ORDER BY method_id ASC
    `,

  // ============ ORDER STATUSES ============

  /**
   * Get all order statuses
   */
  GET_ORDER_STATUSES: `
        SELECT
            status_id,
            name,
            description
        FROM public.order_statuses
        ORDER BY status_id ASC
    `,

  // ============ ASSIGNMENT STATUSES ============

  /**
   * Get all assignment statuses
   */
  GET_ASSIGNMENT_STATUSES: `
        SELECT
            status_id,
            name,
            description
        FROM public.assignment_statuses
        ORDER BY status_id ASC
    `,
};
