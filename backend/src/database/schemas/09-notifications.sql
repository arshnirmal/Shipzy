-- 09-notifications.sql
-- Notification queue and FCM tokens
-- Notification Channels and Statuses moved to public schema for centralized master data

CREATE TABLE notifications.queue (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    channel_id INT NOT NULL REFERENCES public.notification_channels (channel_id),
    status_id INT NOT NULL REFERENCES public.notification_statuses (status_id),
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    failure_reason TEXT,
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_queue_user_id ON notifications.queue (user_id);

CREATE INDEX idx_notifications_queue_status_id ON notifications.queue (status_id);

CREATE INDEX idx_notifications_queue_scheduled_at ON notifications.queue (scheduled_at)
WHERE
    scheduled_at IS NOT NULL;

CREATE INDEX idx_notifications_queue_created_at ON notifications.queue (created_at DESC);

CREATE TABLE notifications.fcm_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users.profiles (user_id) ON DELETE CASCADE,
    device_token TEXT NOT NULL,
    device_type VARCHAR(20) NOT NULL,
    device_info JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (user_id, device_token)
);

CREATE INDEX idx_notifications_fcm_tokens_user_id ON notifications.fcm_tokens (user_id);

CREATE INDEX idx_notifications_fcm_tokens_active ON notifications.fcm_tokens (is_active)
WHERE
    is_active = TRUE;

CREATE TRIGGER set_timestamp_notifications_fcm_tokens BEFORE
UPDATE
    ON notifications.fcm_tokens FOR EACH ROW EXECUTE FUNCTION public.trigger_set_timestamp();