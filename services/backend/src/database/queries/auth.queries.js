// services/backend/src/database/queries/auth.queries.js

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
            u.user_id,
            u.user_uuid,
            u.role_id,
            r.name AS role_name,
            u.firebase_uid,
            u.phone_number,
            u.email,
            u.full_name,
            u.profile_picture_url,
            u.is_verified,
            u.is_active,
            u.created_at
        FROM users.profiles u
        JOIN public.user_roles r ON u.role_id = r.role_id
        WHERE u.firebase_uid = $1
            AND u.deleted_at IS NULL
    `,
    
    /**
     * Find user by UUID (for JWT payload)
     */
    FIND_USER_BY_UUID: `
        SELECT 
            u.user_id,
            u.user_uuid,
            u.role_id,
            r.name AS role_name,
            u.firebase_uid,
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
            AND u.is_active = true
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
            u.firebase_uid,
            u.phone_number,
            u.email,
            u.full_name,
            u.is_verified,
            u.is_active
        FROM users.profiles u
        JOIN public.user_roles r ON u.role_id = r.role_id
        WHERE u.phone_number = $1
            AND u.deleted_at IS NULL
    `,
    
    // ============ USER CREATION ============
    
    /**
     * Create new user profile
     */
    CREATE_USER: `
        INSERT INTO users.profiles (
            role_id,
            firebase_uid,
            phone_number,
            full_name,
            email,
            is_verified
        )
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING 
            user_id,
            user_uuid,
            role_id,
            firebase_uid,
            phone_number,
            full_name,
            email,
            is_verified,
            created_at
    `,
    
    /**
     * Update Firebase UID for existing user
     */
    UPDATE_FIREBASE_UID: `
        UPDATE users.profiles
        SET firebase_uid = $2, updated_at = NOW()
        WHERE user_id = $1
        RETURNING user_id, firebase_uid
    `,
    
    // ============ JWT TOKEN MANAGEMENT ============
    
    /**
     * Store JWT token hash in auth_sessions
     */
    STORE_JWT_TOKEN: `
        INSERT INTO users.auth_sessions (
            user_id,
            phone_number,
            jwt_token_hash,
            device_id,
            device_info,
            ip_address,
            is_verified,
            verified_at,
            expires_at,
            last_activity_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW() + INTERVAL '7 days', NOW())
        RETURNING session_id, expires_at
    `,
    
    /**
     * Validate JWT token (check if not revoked)
     */
    VALIDATE_JWT_TOKEN: `
        SELECT 
            s.session_id,
            s.user_id,
            s.phone_number,
            s.expires_at,
            s.last_activity_at,
            u.user_uuid,
            u.full_name,
            u.role_id,
            r.name AS role_name,
            u.is_active,
            u.is_verified
        FROM users.auth_sessions s
        JOIN users.profiles u ON s.user_id = u.user_id
        JOIN public.user_roles r ON u.role_id = r.role_id
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
        RETURNING session_id
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
        RETURNING status_id, courier_id
    `,
};
