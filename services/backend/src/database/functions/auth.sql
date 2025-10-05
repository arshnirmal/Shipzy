-- ========================================
-- SHIPZY - AUTHENTICATION FUNCTIONS
-- Phone/OTP-based authentication
-- ========================================

-- ========================================
-- Function: send_otp
-- Description: Generate and store OTP for phone number
-- Returns: JSON with session details
-- ========================================
CREATE OR REPLACE FUNCTION users.send_otp(
    p_phone_number VARCHAR(20),
    p_device_id VARCHAR(255) DEFAULT NULL,
    p_device_info JSONB DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_otp_code VARCHAR(6);
    v_session_id INT;
    v_existing_attempts INT;
    result JSON;
BEGIN
    -- Validate phone number format
    IF p_phone_number !~ '^\+?[1-9]\d{1,14}$' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid phone number format',
            'error_code', 'INVALID_PHONE'
        );
    END IF;
    
    -- Check for recent OTP attempts (rate limiting)
    SELECT verification_attempts INTO v_existing_attempts
    FROM users.auth_sessions
    WHERE phone_number = p_phone_number
        AND otp_expires_at > NOW()
        AND is_verified = false
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_existing_attempts >= 5 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Too many OTP attempts. Please try again after 10 minutes.',
            'error_code', 'RATE_LIMIT_EXCEEDED'
        );
    END IF;
    
    -- Generate 6-digit OTP
    v_otp_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Insert or update auth session
    INSERT INTO users.auth_sessions (
        phone_number,
        otp_code,
        otp_expires_at,
        device_id,
        device_info,
        ip_address,
        is_verified,
        verification_attempts
    )
    VALUES (
        p_phone_number,
        v_otp_code,
        NOW() + INTERVAL '10 minutes',
        p_device_id,
        p_device_info,
        p_ip_address,
        false,
        0
    )
    ON CONFLICT (phone_number)
    WHERE is_verified = false AND otp_expires_at > NOW()
    DO UPDATE SET
        otp_code = v_otp_code,
        otp_expires_at = NOW() + INTERVAL '10 minutes',
        device_id = p_device_id,
        device_info = p_device_info,
        ip_address = p_ip_address,
        verification_attempts = 0,
        created_at = NOW()
    RETURNING session_id INTO v_session_id;
    
    -- Build success response
    SELECT json_build_object(
        'success', true,
        'session_id', v_session_id,
        'phone_number', p_phone_number,
        'otp_expires_at', NOW() + INTERVAL '10 minutes',
        'otp_code', v_otp_code  -- REMOVE IN PRODUCTION, only for development
    ) INTO result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'INTERNAL_ERROR'
    );
END;
$$;

COMMENT ON FUNCTION users.send_otp IS 'Generate and send OTP to phone number for authentication';

-- ========================================
-- Function: verify_otp_and_create_user
-- Description: Verify OTP and create user if first-time login
-- Returns: JSON with user details and JWT-ready data
-- ========================================
CREATE OR REPLACE FUNCTION users.verify_otp_and_create_user(
    p_phone_number VARCHAR(20),
    p_otp_code VARCHAR(6),
    p_full_name VARCHAR(100) DEFAULT NULL,
    p_role_name VARCHAR(50) DEFAULT 'client'
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
    v_session_id INT;
    v_user_id INT;
    v_user_uuid UUID;
    v_is_new_user BOOLEAN := false;
    v_role_id INT;
    result JSON;
BEGIN
    -- Verify OTP
    UPDATE users.auth_sessions
    SET 
        is_verified = true,
        verified_at = NOW(),
        verification_attempts = verification_attempts + 1
    WHERE phone_number = p_phone_number
        AND otp_code = p_otp_code
        AND otp_expires_at > NOW()
        AND is_verified = false
        AND verification_attempts < 5
    RETURNING session_id INTO v_session_id;
    
    -- Check if OTP verification succeeded
    IF NOT FOUND THEN
        -- Increment failed attempts
        UPDATE users.auth_sessions
        SET verification_attempts = verification_attempts + 1
        WHERE phone_number = p_phone_number
            AND otp_expires_at > NOW()
            AND is_verified = false;
        
        RETURN json_build_object(
            'success', false,
            'error', 'Invalid or expired OTP',
            'error_code', 'INVALID_OTP'
        );
    END IF;
    
    -- Check if user already exists
    SELECT user_id, user_uuid INTO v_user_id, v_user_uuid
    FROM users.profiles
    WHERE phone_number = p_phone_number
        AND deleted_at IS NULL;
    
    -- Create new user if doesn't exist
    IF NOT FOUND THEN
        v_is_new_user := true;
        
        -- Get role_id
        SELECT role_id INTO v_role_id
        FROM public.user_roles
        WHERE name = p_role_name;
        
        IF NOT FOUND THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Invalid role name',
                'error_code', 'INVALID_ROLE'
            );
        END IF;
        
        -- Validate full_name for new users
        IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
            RETURN json_build_object(
                'success', false,
                'error', 'Full name is required for new users',
                'error_code', 'MISSING_NAME'
            );
        END IF;
        
        -- Create user profile
        INSERT INTO users.profiles (
            role_id,
            phone_number,
            full_name,
            is_verified
        )
        VALUES (
            v_role_id,
            p_phone_number,
            p_full_name,
            true
        )
        RETURNING user_id, user_uuid INTO v_user_id, v_user_uuid;
        
        -- Initialize courier status if role is courier
        IF p_role_name = 'courier' THEN
            INSERT INTO logistics.courier_status (courier_id, is_available, is_online)
            VALUES (v_user_id, false, false);
        END IF;
    END IF;
    
    -- Link session to user
    UPDATE users.auth_sessions
    SET user_id = v_user_id
    WHERE session_id = v_session_id;
    
    -- Build success response
    SELECT json_build_object(
        'success', true,
        'is_new_user', v_is_new_user,
        'session_id', v_session_id,
        'user', json_build_object(
            'user_id', v_user_id,
            'user_uuid', v_user_uuid,
            'phone_number', p_phone_number,
            'full_name', COALESCE(p_full_name, u.full_name),
            'role', r.name,
            'is_verified', true
        )
    ) INTO result
    FROM users.profiles u
    JOIN public.user_roles r ON u.role_id = r.role_id
    WHERE u.user_id = v_user_id;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', 'INTERNAL_ERROR'
    );
END;
$$;

COMMENT ON FUNCTION users.verify_otp_and_create_user IS 'Verify OTP and create user profile if first-time login';