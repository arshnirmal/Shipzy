// services/backend/src/database/queries/auth.queries.ts

/**
 * Authentication-related SQL queries
 * Firebase Auth + JWT token management
 */

export default {
  // ============ USER LOOKUP ============

  /**
   * Find user by Firebase UID
   */
  FIND_USER_BY_FIREBASE_UID: `
    SELECT
      u.user_id AS "userId",
      u.user_uuid AS "userUuid",
      CASE u.role
        WHEN 'client' THEN 1
        WHEN 'courier' THEN 2
        WHEN 'admin' THEN 3
        WHEN 'business' THEN 4
      END AS "roleId",
      u.role AS "roleName",
      u.firebase_uid AS "firebaseUid",
      u.phone_number AS "phoneNumber",
      u.email AS "email",
      u.full_name AS "fullName",
      u.profile_picture_url AS "profilePictureUrl",
      u.is_verified AS "isVerified",
      u.is_active AS "isActive",
      u.created_at AS "createdAt"
    FROM users.profiles u
    WHERE u.firebase_uid = $1
      AND u.deleted_at IS NULL
  `,

  /**
   * Find user by UUID (for JWT payload)
   */
  FIND_USER_BY_UUID: `
    SELECT
      u.user_id AS "userId",
      u.user_uuid AS "userUuid",
      CASE u.role
        WHEN 'client' THEN 1
        WHEN 'courier' THEN 2
        WHEN 'admin' THEN 3
        WHEN 'business' THEN 4
      END AS "roleId",
      u.role AS "roleName",
      u.firebase_uid AS "firebaseUid",
      u.phone_number AS "phoneNumber",
      u.email AS "email",
      u.full_name AS "fullName",
      u.profile_picture_url AS "profilePictureUrl",
      u.is_verified AS "isVerified",
      u.is_active AS "isActive",
      u.created_at AS "createdAt"
      FROM users.profiles u
      WHERE u.user_uuid = $1
        AND u.deleted_at IS NULL
        AND u.is_active = true
    `,

  /**
   * Find user by phone number
   */
  FIND_USER_BY_PHONE: `
      SELECT
        u.user_id AS "userId",
        u.user_uuid AS "userUuid",
        CASE u.role
          WHEN 'client' THEN 1
          WHEN 'courier' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'business' THEN 4
        END AS "roleId",
        u.role AS "roleName",
        u.firebase_uid AS "firebaseUid",
        u.phone_number AS "phoneNumber",
        u.email AS "email",
        u.full_name AS "fullName",
        u.password_hash AS "passwordHash",
        u.is_verified AS "isVerified",
        u.is_active AS "isActive",
        u.created_at AS "createdAt"
      FROM users.profiles u
      WHERE u.phone_number = $1
        AND u.deleted_at IS NULL
    `,

  /**
   * Find user by email (for email/password login)
   */
  FIND_USER_BY_EMAIL: `
      SELECT
        u.user_id AS "userId",
        u.user_uuid AS "userUuid",
        CASE u.role
          WHEN 'client' THEN 1
          WHEN 'courier' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'business' THEN 4
        END AS "roleId",
        u.role AS "roleName",
        u.firebase_uid AS "firebaseUid",
        u.phone_number AS "phoneNumber",
        u.email AS "email",
        u.full_name AS "fullName",
        u.password_hash AS "passwordHash",
        u.is_verified AS "isVerified",
        u.is_active AS "isActive",
        u.created_at AS "createdAt"
      FROM users.profiles u
      WHERE u.email = $1
        AND u.deleted_at IS NULL
    `,

  // ============ USER CREATION ============

  /**
   * Create new user profile (Firebase/Google/Phone)
   */
  CREATE_USER: `
      INSERT INTO users.profiles (
        role,
        firebase_uid,
        phone_number,
        full_name,
        email,
        password_hash,
        is_verified
      )
      VALUES (
        CASE
          WHEN $1 = 1 THEN 'client'::user_role
          WHEN $1 = 2 THEN 'courier'::user_role
          WHEN $1 = 3 THEN 'admin'::user_role
          WHEN $1 = 4 THEN 'business'::user_role
          ELSE 'client'::user_role
        END,
        $2, $3, $4, $5, $6, true
      )
      RETURNING
        user_id AS "userId",
        user_uuid AS "userUuid",
        CASE role
          WHEN 'client' THEN 1
          WHEN 'courier' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'business' THEN 4
        END AS "roleId",
        firebase_uid AS "firebaseUid",
        phone_number AS "phoneNumber",
        full_name AS "fullName",
        email AS "email",
        is_verified AS "isVerified",
        created_at AS "createdAt"
    `,

  /**
   * Create new user profile for email/password registration
   */
  CREATE_EMAIL_USER: `
      INSERT INTO users.profiles (
        role,
        full_name,
        email,
        password_hash,
        phone_number,
        is_verified
      )
      VALUES (
        CASE
          WHEN $1 = 1 THEN 'client'::user_role
          WHEN $1 = 2 THEN 'courier'::user_role
          WHEN $1 = 3 THEN 'admin'::user_role
          WHEN $1 = 4 THEN 'business'::user_role
          ELSE 'client'::user_role
        END,
        $2, $3, $4, $5, false
      )
      RETURNING
        user_id AS "userId",
        user_uuid AS "userUuid",
        CASE role
          WHEN 'client' THEN 1
          WHEN 'courier' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'business' THEN 4
        END AS "roleId",
        full_name AS "fullName",
        email AS "email",
        phone_number AS "phoneNumber",
        is_verified AS "isVerified",
        created_at AS "createdAt"
    `,

  // NOTE: UPDATE_FIREBASE_UID removed - not used anywhere, can be done via Drizzle if needed

  // ============ JWT TOKEN MANAGEMENT ============

  /**
   * Store JWT token hash in auth_sessions
   */
  STORE_JWT_TOKEN: `
      INSERT INTO users.auth_sessions (
        user_id,
        email,
        phone_number,
        jwt_token_hash,
        device_id,
        device_info,
        ip_address,
        auth_method,
        is_verified,
        verified_at,
        expires_at,
        last_activity_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW() + INTERVAL '7 days', NOW())
      RETURNING session_id AS "sessionId", expires_at AS "expiresAt"
    `,

  /**
   * Validate JWT token (check if not revoked)
   */
  VALIDATE_JWT_TOKEN: `
      SELECT
        s.session_id AS "sessionId",
        s.user_id AS "userId",
        s.phone_number AS "phoneNumber",
        s.expires_at AS "expiresAt",
        s.last_activity_at AS "lastActivityAt",
        u.user_uuid AS "userUuid",
        u.full_name AS "fullName",
        CASE u.role
          WHEN 'client' THEN 1
          WHEN 'courier' THEN 2
          WHEN 'admin' THEN 3
          WHEN 'business' THEN 4
        END AS "roleId",
        u.role AS "roleName",
        u.is_active AS "isActive",
        u.is_verified AS "isVerified"
      FROM users.auth_sessions s
      JOIN users.profiles u ON s.user_id = u.user_id
      WHERE s.jwt_token_hash = $1
        AND s.expires_at > NOW()
        AND u.is_active = true
        AND u.deleted_at IS NULL
    `,

  /**
   * Update last activity timestamp
   */
  UPDATE_SESSION_ACTIVITY: `
      UPDATE users.auth_sessions
      SET last_activity_at = NOW()
      WHERE jwt_token_hash = $1
    `,

  /**
   * Revoke JWT token (logout)
   */
  REVOKE_JWT_TOKEN: `
      UPDATE users.auth_sessions
      SET expires_at = NOW()
      WHERE jwt_token_hash = $1
      RETURNING session_id AS "sessionId"
    `,

  /**
   * Revoke all user tokens (logout from all devices)
   */
  REVOKE_ALL_USER_TOKENS: `
      UPDATE users.auth_sessions
      SET expires_at = NOW()
      WHERE user_id = $1
        AND expires_at > NOW()
    `,

  // ============ COURIER INITIALIZATION ============

  /**
   * Initialize courier status after courier registration
   */
  INITIALIZE_COURIER_STATUS: `
      INSERT INTO logistics.courier_status (
        courier_id,
        is_available,
        is_online
      )
      VALUES ($1, false, false)
      ON CONFLICT (courier_id) DO NOTHING
      RETURNING status_id AS "statusId", courier_id AS "courierId"
    `,
};
