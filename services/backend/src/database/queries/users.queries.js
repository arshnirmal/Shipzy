// services/backend/src/database/queries/users.queries.js

/**
 * User profile and address management queries
 */

export default {
  // ============ USER PROFILE ============
  
  /**
   * Find user by UUID (for JWT payload)
   */
  FIND_USER_BY_UUID: `
      SELECT 
          u.user_id,
          u.user_uuid,
          u.role_id,
          r.name AS role_name,
          u.phone_number,
          u.email,
          u.full_name,
          u.profile_picture_url,
          u.is_verified,
          u.is_active,
          u.created_at
      FROM users.profiles u
      JOIN public.user_roles r ON u.role_id = r.role_id
      WHERE u.user_uuid = $1
          AND u.deleted_at IS NULL
  `,
  
  /**
   * Find user by phone number
   */
  FIND_USER_BY_PHONE: `
      SELECT 
          u.user_id,
          u.user_uuid,
          u.role_id,
          r.name AS role_name,
          u.phone_number,
          u.email,
          u.full_name,
          u.profile_picture_url,
          u.is_verified,
          u.is_active,
          u.created_at
      FROM users.profiles u
      JOIN public.user_roles r ON u.role_id = r.role_id
      WHERE u.phone_number = $1
          AND u.deleted_at IS NULL
  `,
  
  /**
   * Update user profile
   */
  UPDATE_USER_PROFILE: `
      UPDATE users.profiles
      SET 
          full_name = COALESCE($2, full_name),
          email = COALESCE($3, email),
          profile_picture_url = COALESCE($4, profile_picture_url),
          updated_at = NOW()
      WHERE user_id = $1
      RETURNING user_id, full_name, email, profile_picture_url, updated_at
  `,
  
  // ============ USER ADDRESSES ============
  
  /**
   * Get user's saved addresses
   */
  GET_USER_ADDRESSES: `
      SELECT 
          a.address_id,
          a.address_type,
          a.label,
          a.full_address,
          a.landmark,
          a.city,
          a.state,
          a.postal_code,
          ST_Y(a.location::geometry) AS latitude,
          ST_X(a.location::geometry) AS longitude,
          a.is_default,
          a.created_at
      FROM users.addresses a
      WHERE a.user_id = $1
      ORDER BY a.is_default DESC, a.created_at DESC
  `,
  
  /**
   * Save new address
   */
  SAVE_ADDRESS: `
      INSERT INTO users.addresses (
          user_id,
          address_type,
          label,
          full_address,
          landmark,
          city,
          state,
          postal_code,
          location,
          is_default
      )
      VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          ST_SetSRID(ST_MakePoint($10, $9), 4326)::geography,
          $11
      )
      RETURNING address_id, label, full_address, is_default, created_at
  `,
  
  /**
   * Unset default addresses for user
   */
  UNSET_DEFAULT_ADDRESSES: `
      UPDATE users.addresses
      SET is_default = false
      WHERE user_id = $1
  `,
  
  /**
   * Delete address
   */
  DELETE_ADDRESS: `
      DELETE FROM users.addresses
      WHERE address_id = $1 AND user_id = $2
      RETURNING address_id
  `,
};
