// services/backend/src/types/drivers.ts

export interface DbCourier {
  courier_id: number;
  user_id: number;
  user_uuid: string;
  full_name: string;
  email?: string;
  phone_number: string;
  profile_picture_url?: string;
  is_verified: boolean;
  is_active: boolean;
  is_available: boolean;
  is_online: boolean;
  current_latitude?: string;
  current_longitude?: string;
  last_location_update?: Date;
  total_deliveries_today: number;
  vehicle_id?: number;
  vehicle_number?: string;
  vehicle_model?: string;
  vehicle_year?: number;
  vehicle_category_id?: number;
  vehicle_category?: string;
  vehicle_is_active?: boolean;
  vehicle_max_weight?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CourierAvailabilityResult {
  courier_id: number;
  is_available: boolean;
  is_online: boolean;
  updated_at: Date;
}

export interface CourierLocationResult {
  courier_id: number;
  latitude: number;
  longitude: number;
  last_location_update: Date;
}

export interface EarningsSummaryRow {
  total_deliveries: number;
  today_deliveries: number;
  week_deliveries: number;
  month_deliveries: number;
  total_earnings: number;
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
  avg_order_value: number;
  total_distance_km: number;
}

export interface CourierAssignmentRow {
  assignment_id: number;
  order_id: number;
  order_uuid?: string;
  order_number?: string;
  order_status?: string;
  assignment_status_id?: number;
  assignment_status?: string;

  // vehicle/package info
  vehicle_category?: string;
  vehicle_category_display?: string;
  package_type?: string;
  weight_tier_id?: number;
  weight_tier_name?: string;
  weight_tier_min?: number | string;
  weight_tier_max?: number | string;

  // pickup location
  pickup_address?: string;
  pickup_building?: string;
  pickup_landmark?: string;
  pickup_city?: string;
  pickup_state?: string;
  pickup_postal_code?: string;
  pickup_latitude?: number | string;
  pickup_longitude?: number | string;
  pickup_contact_name?: string;
  pickup_contact_phone?: string;

  // delivery location
  delivery_address?: string;
  delivery_building?: string;
  delivery_landmark?: string;
  delivery_city?: string;
  delivery_state?: string;
  delivery_postal_code?: string;
  delivery_latitude?: number | string;
  delivery_longitude?: number | string;
  delivery_contact_name?: string;
  delivery_contact_phone?: string;

  package_description?: string;
  special_instructions?: string;
  declared_value?: number | string;
  estimated_distance_km?: number | string;
  actual_distance_km?: number | string;
  delivery_type?: string;

  // pricing / breakdown
  base_price?: number | string;
  distance_price?: number | string;
  weight_surcharge?: number | string;
  platform_fee?: number | string;
  special_handling_fee?: number | string;
  gst_amount?: number | string;
  subtotal_before_tax?: number | string;
  total_price?: number | string;

  assigned_at?: Date;
  accepted_at?: Date;
}
