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
        dt.display_name,
        dt.description,
        dt.base_rate,
        dt.per_km_rate,
        dt.sort_order,
        dt.is_active,
        
        -- Promotional labels (NEW, 40% OFF, etc.)
        COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'labelId', l.label_id,
            'text', l.display_text,
            'color', l.color,
            'backgroundColor', l.background_color
        ) ORDER BY dtl.display_order) FILTER (WHERE l.label_id IS NOT NULL),
        '[]'::json
        ) AS labels,
        
        -- Supported vehicle categories with max weights
        COALESCE(
        json_agg(DISTINCT jsonb_build_object(
            'categoryId', vc.category_id,
            'name', vc.name,
            'displayName', vc.display_name,
            'maxWeightKg', vc.max_weight_kg,
            'iconUrl', vc.icon_url
        )) FILTER (WHERE vc.category_id IS NOT NULL),
        '[]'::json
        ) AS supported_vehicles
        
    FROM public.delivery_types dt
    LEFT JOIN public.delivery_type_labels dtl ON dt.delivery_type_id = dtl.delivery_type_id
    LEFT JOIN public.labels l ON dtl.label_id = l.label_id AND l.is_active = TRUE
    LEFT JOIN public.delivery_type_capabilities dtc ON dt.delivery_type_id = dtc.delivery_type_id AND dtc.is_active = TRUE
    LEFT JOIN public.vehicle_categories vc ON dtc.vehicle_category_id = vc.category_id AND vc.is_active = TRUE
    WHERE dt.is_active = TRUE
    GROUP BY dt.delivery_type_id
    ORDER BY dt.sort_order ASC
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
            display_name,
            description,
            max_weight_kg,
            icon_url,
            is_active
        FROM public.vehicle_categories
        WHERE is_active = TRUE
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

  /**
   * Get weight tiers for a specific delivery type + vehicle combination
   */
  GET_WEIGHT_TIERS_FOR_COMBO: `
        SELECT 
            wt.tier_id,
            wt.name,
            wt.min_weight_kg,
            wt.max_weight_kg,
            wt.additional_charge
        FROM public.weight_tiers wt
        JOIN public.delivery_type_capabilities dtc 
        ON wt.tier_id = dtc.weight_tier_id
        WHERE dtc.delivery_type_id = $1
        AND dtc.vehicle_category_id = $2
        AND dtc.is_active = TRUE
        ORDER BY wt.min_weight_kg ASC

    `,

  /**
   * Get complete delivery options for order creation UI
   * Returns delivery types with supported vehicles and labels
   */
  GET_DELIVERY_OPTIONS: `
        SELECT 
            dt.delivery_type_id,
            dt.name,
            dt.display_name,
            dt.description,
            dt.base_rate,
            dt.per_km_rate,
            dt.sort_order,
            dt.is_active,
            
            -- Labels (promotional tags like "NEW", "40% OFF")
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                'labelId', l.label_id,
                'name', l.name,
                'displayText', l.display_text,
                'color', l.color,
                'backgroundColor', l.background_color
                ) ORDER BY dtl.display_order) FILTER (WHERE l.label_id IS NOT NULL),
                '[]'::json
            ) AS labels,
            
            -- Supported vehicle categories
            COALESCE(
                json_agg(DISTINCT jsonb_build_object(
                'categoryId', vc.category_id,
                'name', vc.name,
                'displayName', vc.display_name,
                'maxWeightKg', vc.max_weight_kg,
                'iconUrl', vc.icon_url
                )) FILTER (WHERE vc.category_id IS NOT NULL),
                '[]'::json
            ) AS supported_vehicles
            
        FROM public.delivery_types dt
        LEFT JOIN public.delivery_type_labels dtl 
        ON dt.delivery_type_id = dtl.delivery_type_id
        LEFT JOIN public.labels l 
        ON dtl.label_id = l.label_id AND l.is_active = TRUE
        LEFT JOIN public.delivery_type_capabilities dtc 
        ON dt.delivery_type_id = dtc.delivery_type_id AND dtc.is_active = TRUE
        LEFT JOIN public.vehicle_categories vc 
        ON dtc.vehicle_category_id = vc.category_id AND vc.is_active = TRUE
        WHERE dt.is_active = TRUE
        GROUP BY dt.delivery_type_id
        ORDER BY dt.sort_order ASC
  `,
};
