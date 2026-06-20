// services/backend/src/database/queries/webhook-events.queries.ts
// Deduplication queries for provider webhook events.

export default {
  /**
   * Insert a new webhook event row only if the event_id is not already present.
   * Returns the inserted event_id on success, empty result on conflict (duplicate).
   */
  INSERT_EVENT_IF_NEW: `
    INSERT INTO payments.payment_webhook_events (provider, event_id, event_type, payload, status)
    VALUES ($1, $2, $3, $4, 'received')
    ON CONFLICT (event_id) DO NOTHING
    RETURNING event_id AS "eventId"
  `,

  /**
   * Mark a previously-inserted webhook event as processed.
   */
  MARK_EVENT_PROCESSED: `
    UPDATE payments.payment_webhook_events
    SET status = 'processed', processed_at = NOW()
    WHERE event_id = $1
  `,
};
