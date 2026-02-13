// services/backend/src/database/queries/notifications.queries.js

/**
 * Notification queue and FCM token queries
 */

export default {
  // ============ NOTIFICATION QUEUE ============

  /**
   * Queue notification for user
   */
  QUEUE_NOTIFICATION: `
      INSERT INTO notifications.queue (
          user_id,
          channel_id,
          status_id,
          title,
          body,
          data,
          priority,
          scheduled_at
      )
      VALUES (
          $1,
          (SELECT channel_id FROM public.notification_channels WHERE name = $2),
          (SELECT status_id FROM public.notification_statuses WHERE name = 'pending'),
          $3, $4, $5, $6, $7
      )
      RETURNING notification_id, created_at
  `,

  /**
   * Get pending notifications (for processing)
   */
  GET_PENDING_NOTIFICATIONS: `
      SELECT 
          n.notification_id,
          n.user_id,
          nc.name AS channel,
          n.title,
          n.body,
          n.data,
          n.priority,
          n.retry_count,
          n.created_at
      FROM notifications.queue n
      JOIN public.notification_channels nc ON n.channel_id = nc.channel_id
      WHERE n.status_id = (SELECT status_id FROM public.notification_statuses WHERE name = 'pending')
          AND (n.scheduled_at IS NULL OR n.scheduled_at <= NOW())
          AND n.retry_count < n.max_retries
      ORDER BY n.priority DESC, n.created_at ASC
      LIMIT $1
  `,

  /**
   * Mark notification as sent
   */
  MARK_NOTIFICATION_SENT: `
      UPDATE notifications.queue
      SET 
          status_id = (SELECT status_id FROM public.notification_statuses WHERE name = 'sent'),
          sent_at = NOW()
      WHERE notification_id = $1
      RETURNING notification_id, sent_at
  `,

  /**
   * Mark notification as failed
   */
  MARK_NOTIFICATION_FAILED: `
      UPDATE notifications.queue
      SET 
          status_id = (SELECT status_id FROM public.notification_statuses WHERE name = 'failed'),
          failed_at = NOW(),
          failure_reason = $2,
          retry_count = retry_count + 1
      WHERE notification_id = $1
      RETURNING notification_id, retry_count
  `,

  // ============ FCM TOKENS ============

  /**
   * Save FCM device token
   */
  SAVE_FCM_TOKEN: `
      INSERT INTO notifications.fcm_tokens (
          user_id,
          device_token,
          device_type,
          device_info
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, device_token)
      DO UPDATE SET
          is_active = true,
          last_used_at = NOW(),
          updated_at = NOW()
      RETURNING token_id, device_token
  `,

  /**
   * Get active FCM tokens for user
   */
  GET_USER_FCM_TOKENS: `
      SELECT 
          token_id,
          device_token,
          device_type,
          device_info,
          last_used_at
      FROM notifications.fcm_tokens
      WHERE user_id = $1
          AND is_active = true
      ORDER BY last_used_at DESC
  `,

  /**
   * Deactivate FCM token
   */
  DEACTIVATE_FCM_TOKEN: `
      UPDATE notifications.fcm_tokens
      SET 
          is_active = false,
          updated_at = NOW()
      WHERE device_token = $1
      RETURNING token_id
  `,
};
