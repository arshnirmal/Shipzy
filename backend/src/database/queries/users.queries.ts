// services/backend/src/database/queries/users.queries.ts

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
            u.user_id AS "userId",
            u.user_uuid AS "userUuid",
            u.role_id AS "roleId",
            r.name AS "roleName",
            u.phone_number AS "phoneNumber",
            u.email AS "email",
            u.full_name AS "fullName",
            u.profile_picture_url AS "profilePictureUrl",
            u.is_verified AS "isVerified",
            u.is_active AS "isActive",
            u.created_at AS "createdAt"
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
            u.user_id AS "userId",
            u.user_uuid AS "userUuid",
            u.role_id AS "roleId",
            r.name AS "roleName",
            u.phone_number AS "phoneNumber",
            u.email AS "email",
            u.full_name AS "fullName",
            u.profile_picture_url AS "profilePictureUrl",
            u.is_verified AS "isVerified",
            u.is_active AS "isActive",
            u.created_at AS "createdAt"
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
      RETURNING
          user_id AS "userId",
          full_name AS "fullName",
          email AS "email",
          profile_picture_url AS "profilePictureUrl",
          updated_at AS "updatedAt"
  `,

  // ============ USER ADDRESSES ============

  /**
   * Get user's saved addresses
   */
  GET_USER_ADDRESSES: `
      SELECT
          a.address_id AS "addressId",
          a.address_type AS "addressType",
          a.label AS "label",
          a.full_address AS "fullAddress",
          a.building AS "building",
          a.floor AS "floor",
          a.flat_number AS "flatNumber",
          a.landmark AS "landmark",
          a.city AS "city",
          a.state AS "state",
          a.postal_code AS "postalCode",
          ST_Y(a.location::geometry) AS "latitude",
          ST_X(a.location::geometry) AS "longitude",
          a.is_default AS "isDefault",
          a.created_at AS "createdAt"
      FROM users.addresses a
      WHERE a.user_id = $1
      ORDER BY a.is_default DESC, a.created_at DESC
  `,

  /**
   * Get single address by ID
   */
  GET_ADDRESS_BY_ID: `
      SELECT
          a.address_id AS "addressId",
          a.user_id AS "userId",
          a.address_type AS "addressType",
          a.label AS "label",
          a.full_address AS "fullAddress",
          a.building AS "building",
          a.floor AS "floor",
          a.flat_number AS "flatNumber",
          a.landmark AS "landmark",
          a.city AS "city",
          a.state AS "state",
          a.postal_code AS "postalCode",
          ST_Y(a.location::geometry) AS "latitude",
          ST_X(a.location::geometry) AS "longitude",
          a.is_default AS "isDefault"
      FROM users.addresses a
      WHERE a.address_id = $1
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
          building,
          floor,
          flat_number,
          landmark,
          city,
          state,
          postal_code,
          location,
          is_default
      )
      VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
          ST_SetSRID(ST_MakePoint($12, $13), 4326)::geography,
          $14
      )
      RETURNING
          address_id AS "addressId",
          label AS "label",
          full_address AS "fullAddress",
          is_default AS "isDefault",
          created_at AS "createdAt"
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
      RETURNING address_id AS "addressId"
  `,
};
