// services/backend/src/database/queries/auth.queries.js

/**
 * Authentication-related SQL queries
 * Phone/OTP-based authentication
 */

module.exports = {
  // ============ OTP SESSION MANAGEMENT ============
  
  /**
   * Call stored function: Send OTP
   */
  CALL_SEND_OTP: `
      SELECT users.send_otp($1, $2, $3, $4) AS result
  `,
  
  /**
   * Call stored function: Verify OTP and create user
   */
  CALL_VERIFY_OTP: `
      SELECT users.verify_otp_and_create_user($1, $2, $3, $4) AS result
  `,
  
  /**
   * Store JWT token hash for revocation checking
   */
  STORE_JWT_TOKEN: `
      UPDATE users.auth_sessions
      SET 
          jwt_token_hash = $1,
          expires_at = NOW() + INTERVAL '7 days',
          last_activity_at = NOW()
      WHERE session_id = $2
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
   * Revoke JWT token (logout)
   */
  REVOKE_JWT_TOKEN: `
      UPDATE users.auth_sessions
      SET expires_at = NOW()
      WHERE jwt_token_hash = $1
      RETURNING session_id
  `,
  
  /**
   * Clean up expired sessions (run periodically via cron)
   */
  CLEANUP_EXPIRED_SESSIONS: `
      DELETE FROM users.auth_sessions
      WHERE expires_at < NOW() - INTERVAL '30 days'
          OR (is_verified = false AND otp_expires_at < NOW() - INTERVAL '1 day')
  `,
};
