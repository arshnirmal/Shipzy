-- 04-users.sql
-- Users schema (profiles, auth sessions, addresses, business_accounts)
CREATE TABLE users.profiles (
    user_id SERIAL PRIMARY KEY,
    user_uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    role_id INT NOT NULL REFERENCES public.user_roles (role_id),
    firebase_uid VARCHAR(255) UNIQUE,
    phone_number VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(100) NOT NULL,
    profile_picture_url VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT chk_user_contact_required CHECK (
        email IS NOT NULL
        OR firebase_uid IS NOT NULL
        OR phone_number IS NOT NULL
    )
);

CREATE INDEX idx_users_profiles_role_id ON users.profiles (role_id);

CREATE INDEX idx_users_profiles_firebase_uid ON users.profiles (firebase_uid)
WHERE
    firebase_uid IS NOT NULL;

CREATE INDEX idx_users_profiles_email ON users.profiles (email);

CREATE INDEX idx_users_profiles_deleted_at ON users.profiles (deleted_at)
WHERE
    deleted_at IS NULL;

CREATE TRIGGER set_timestamp_users_profiles BEFORE
UPDATE
    ON users.profiles FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Auth sessions
CREATE TABLE users.auth_sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    email VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20),
    otp_code VARCHAR(6),
    otp_expires_at TIMESTAMPTZ,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_attempts INT DEFAULT 0,
    jwt_token_hash VARCHAR(255) UNIQUE NOT NULL,
    device_id VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    auth_method VARCHAR(20) DEFAULT 'email',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_auth_sessions_user_id ON users.auth_sessions (user_id);

CREATE INDEX idx_users_auth_sessions_email ON users.auth_sessions (email);

CREATE INDEX idx_users_auth_sessions_phone ON users.auth_sessions (phone_number);

CREATE INDEX idx_users_auth_sessions_expires_at ON users.auth_sessions (expires_at);

CREATE INDEX idx_users_auth_sessions_jwt_hash ON users.auth_sessions (jwt_token_hash);

COMMENT ON COLUMN users.auth_sessions.otp_code IS 'Plain OTP for development, should be hashed in production';

COMMENT ON COLUMN users.auth_sessions.jwt_token_hash IS 'SHA256 hash of JWT token for revocation checking';

-- Addresses
CREATE TABLE users.addresses (
    address_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    address_type VARCHAR(50),
    label VARCHAR(100),
    building VARCHAR(100),
    floor VARCHAR(10),
    flat_number VARCHAR(10),
    full_address TEXT NOT NULL,
    landmark VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_addresses_user_id ON users.addresses (user_id);

CREATE INDEX idx_users_addresses_location ON users.addresses USING GIST (location);

CREATE TRIGGER set_timestamp_users_addresses BEFORE
UPDATE
    ON users.addresses FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();

-- Business Accounts
CREATE TABLE users.business_accounts (
    business_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    gst_number VARCHAR(15) UNIQUE,
    pan_number VARCHAR(10),
    business_type VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT check_gst_format CHECK (
        gst_number IS NULL
        OR gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    )
);

CREATE INDEX idx_users_business_accounts_user_id ON users.business_accounts (user_id);

CREATE TRIGGER set_timestamp_users_business_accounts BEFORE
UPDATE
    ON users.business_accounts FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();