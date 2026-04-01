-- Shipzy reference / master data (idempotent)
-- Run after Drizzle migrations. Payment methods live in payments.* (not public).

-- ---------------------------------------------------------------------------
-- public.vehicle_categories
-- ---------------------------------------------------------------------------
INSERT INTO public.vehicle_categories (name, display_name, max_weight_kg)
VALUES
  ('2_wheeler', '2-Wheeler (Bike)', 20.00),
  ('3_wheeler', '3-Wheeler (Auto)', 100.00),
  ('mini_truck', 'Mini Truck', 500.00),
  ('truck', 'Truck', 2000.00)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- payments.payment_methods
-- ---------------------------------------------------------------------------
INSERT INTO payments.payment_methods (name, description)
VALUES
  ('Cash on Delivery', 'Cash on Delivery'),
  ('Prepaid via UPI', 'Prepaid via UPI'),
  ('Prepaid via Credit/Debit Card', 'Prepaid via Credit/Debit Card')
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- public.weight_tiers (no unique constraint on name — dedupe by name + range)
-- ---------------------------------------------------------------------------
INSERT INTO public.weight_tiers (name, min_weight_kg, max_weight_kg, additional_charge)
SELECT v.name, v.min_w, v.max_w, v.charge
FROM (
  VALUES
    ('0-1 kg', 0.00::numeric, 1.00::numeric, 0.00::numeric),
    ('1-5 kg', 1.00, 5.00, 10.00),
    ('5-10 kg', 5.00, 10.00, 25.00),
    ('10-15 kg', 10.00, 15.00, 50.00),
    ('15-20 kg', 15.00, 20.00, 75.00),
    ('20-40 kg', 20.00, 40.00, 100.00),
    ('40-60 kg', 40.00, 60.00, 150.00),
    ('60-80 kg', 60.00, 80.00, 200.00),
    ('80-100 kg', 80.00, 100.00, 250.00),
    ('100-200 kg', 100.00, 200.00, 400.00),
    ('200-500 kg', 200.00, 500.00, 800.00)
) AS v(name, min_w, max_w, charge)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.weight_tiers wt
  WHERE wt.name = v.name
    AND wt.min_weight_kg = v.min_w
    AND wt.max_weight_kg = v.max_w
);

-- ---------------------------------------------------------------------------
-- public.delivery_types
-- ---------------------------------------------------------------------------
INSERT INTO public.delivery_types (
  name,
  display_name,
  description,
  base_rate,
  per_km_rate,
  sort_order
)
VALUES
  ('deliver_now', 'Deliver Now', 'Instant pickup & delivery', 50.00, 8.00, 1),
  ('scheduled', 'Scheduled Pickup', 'Schedule for later', 40.00, 7.00, 2),
  ('end_of_day', 'End-of-Day Delivery', 'Deliver by end of day', 35.00, 6.00, 3),
  ('truck_delivery', 'Truck Delivery', 'Heavy cargo delivery', 200.00, 15.00, 4)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- public.package_types
-- ---------------------------------------------------------------------------
INSERT INTO public.package_types (
  name,
  description,
  special_handling_fee,
  requires_special_handling,
  handling_description
)
VALUES
  ('Document', 'Document package', 0.00, FALSE, NULL),
  ('Food', 'Food package', 15.00, TRUE, 'Perishable items - maintain temperature'),
  ('Clothes', 'Clothes package', 0.00, FALSE, NULL),
  ('Electronics', 'Electronics package', 25.00, TRUE, 'Fragile electronics - handle with extra care'),
  ('Medicine', 'Medicine package', 20.00, TRUE, 'Medical supplies - urgent delivery required'),
  ('Gift', 'Gift package', 20.00, TRUE, 'Special occasion items - careful packaging'),
  ('Grocery', 'Grocery package', 0.00, FALSE, NULL),
  ('Pet Supplies', 'Pet Supplies package', 0.00, FALSE, NULL),
  ('Other', 'Other package', 0.00, FALSE, NULL)
ON CONFLICT (name) DO NOTHING;

-- ---------------------------------------------------------------------------
-- public.delivery_type_capabilities
-- ---------------------------------------------------------------------------
INSERT INTO public.delivery_type_capabilities (
  delivery_type_id,
  vehicle_category_id,
  weight_tier_id
)
SELECT dt.delivery_type_id, vc.category_id, wt.tier_id
FROM public.delivery_types dt
CROSS JOIN public.vehicle_categories vc
CROSS JOIN public.weight_tiers wt
WHERE dt.name = 'deliver_now'
  AND vc.name = '2_wheeler'
  AND wt.max_weight_kg <= 20.00
  AND NOT EXISTS (
    SELECT 1
    FROM public.delivery_type_capabilities dtc
    WHERE dtc.delivery_type_id = dt.delivery_type_id
      AND dtc.vehicle_category_id = vc.category_id
      AND dtc.weight_tier_id = wt.tier_id
  );

INSERT INTO public.delivery_type_capabilities (
  delivery_type_id,
  vehicle_category_id,
  weight_tier_id
)
SELECT dt.delivery_type_id, vc.category_id, wt.tier_id
FROM public.delivery_types dt
CROSS JOIN public.vehicle_categories vc
CROSS JOIN public.weight_tiers wt
WHERE dt.name = 'deliver_now'
  AND vc.name = '3_wheeler'
  AND wt.max_weight_kg <= 100.00
  AND NOT EXISTS (
    SELECT 1
    FROM public.delivery_type_capabilities dtc
    WHERE dtc.delivery_type_id = dt.delivery_type_id
      AND dtc.vehicle_category_id = vc.category_id
      AND dtc.weight_tier_id = wt.tier_id
  );

INSERT INTO public.delivery_type_capabilities (
  delivery_type_id,
  vehicle_category_id,
  weight_tier_id
)
SELECT dt.delivery_type_id, vc.category_id, wt.tier_id
FROM public.delivery_types dt
CROSS JOIN public.vehicle_categories vc
CROSS JOIN public.weight_tiers wt
WHERE dt.name = 'scheduled'
  AND vc.name IN ('2_wheeler', '3_wheeler')
  AND (
    (vc.name = '2_wheeler' AND wt.max_weight_kg <= 20.00)
    OR (vc.name = '3_wheeler' AND wt.max_weight_kg <= 100.00)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.delivery_type_capabilities dtc
    WHERE dtc.delivery_type_id = dt.delivery_type_id
      AND dtc.vehicle_category_id = vc.category_id
      AND dtc.weight_tier_id = wt.tier_id
  );

INSERT INTO public.delivery_type_capabilities (
  delivery_type_id,
  vehicle_category_id,
  weight_tier_id
)
SELECT dt.delivery_type_id, vc.category_id, wt.tier_id
FROM public.delivery_types dt
CROSS JOIN public.vehicle_categories vc
CROSS JOIN public.weight_tiers wt
WHERE dt.name = 'end_of_day'
  AND vc.name IN ('2_wheeler', '3_wheeler')
  AND (
    (vc.name = '2_wheeler' AND wt.max_weight_kg <= 20.00)
    OR (vc.name = '3_wheeler' AND wt.max_weight_kg <= 100.00)
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.delivery_type_capabilities dtc
    WHERE dtc.delivery_type_id = dt.delivery_type_id
      AND dtc.vehicle_category_id = vc.category_id
      AND dtc.weight_tier_id = wt.tier_id
  );

INSERT INTO public.delivery_type_capabilities (
  delivery_type_id,
  vehicle_category_id,
  weight_tier_id
)
SELECT dt.delivery_type_id, vc.category_id, wt.tier_id
FROM public.delivery_types dt
CROSS JOIN public.vehicle_categories vc
CROSS JOIN public.weight_tiers wt
WHERE dt.name = 'truck_delivery'
  AND vc.name IN ('mini_truck', 'truck')
  AND wt.min_weight_kg >= 20.00
  AND NOT EXISTS (
    SELECT 1
    FROM public.delivery_type_capabilities dtc
    WHERE dtc.delivery_type_id = dt.delivery_type_id
      AND dtc.vehicle_category_id = vc.category_id
      AND dtc.weight_tier_id = wt.tier_id
  );

-- ---------------------------------------------------------------------------
-- public.pricing_config
-- ---------------------------------------------------------------------------
INSERT INTO public.pricing_config (config_key, config_value, description)
VALUES
  ('platform_fee', 10.00, 'Fixed platform fee added to all orders'),
  ('gst_rate', 0.18, 'GST rate applied to taxable amount (18%)'),
  ('driver_commission_rate', 0.70, 'Driver commission rate (70% of base fare)'),
  ('driver_distance_rate', 0.65, 'Driver earnings rate for distance charges'),
  ('driver_weight_rate', 0.60, 'Driver earnings rate for weight surcharges'),
  ('peak_hour_bonus_rate', 0.15, 'Peak hour bonus as percentage of base payout'),
  ('urgency_bonus_amount', 15.00, 'Fixed bonus for urgent deliveries'),
  ('on_time_bonus_rate', 0.05, 'On-time delivery bonus rate'),
  ('quality_bonus_amount', 5.00, 'Quality bonus for good ratings')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value,
  description = EXCLUDED.description,
  is_active = TRUE,
  updated_at = NOW();
