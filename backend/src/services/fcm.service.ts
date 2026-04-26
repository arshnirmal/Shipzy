// services/backend/src/services/fcm.service.ts
// Lightweight FCM dispatch wrapper. Silent failure — never blocks caller.

import admin from "firebase-admin";
import firebaseApp from "../config/firebase.js";
import logger from "../config/logger.js";
import { drizzlePool } from "../database/drizzle.js";
import notificationsQueries from "../database/queries/notifications.queries.js";

export interface FcmPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

interface ActiveToken {
  userId: number;
  deviceToken: string;
}

async function getActiveTokensForUsers(
  userIds: number[],
): Promise<ActiveToken[]> {
  if (userIds.length === 0) return [];
  const result = await drizzlePool.query<{
    userId: number;
    deviceToken: string;
  }>(
    `SELECT user_id AS "userId", device_token AS "deviceToken"
       FROM notifications.fcm_tokens
      WHERE user_id = ANY($1::int[]) AND is_active = true`,
    [userIds],
  );
  return result.rows;
}

async function deactivateToken(deviceToken: string): Promise<void> {
  try {
    await drizzlePool.query(notificationsQueries.DEACTIVATE_FCM_TOKEN, [
      deviceToken,
    ]);
  } catch (error) {
    logger.warn({
      msg: "Failed to deactivate stale FCM token",
      error: (error as Error).message,
    });
  }
}

function buildMessage(
  token: string,
  payload: FcmPayload,
): admin.messaging.Message {
  return {
    token,
    notification: { title: payload.title, body: payload.body },
    data: payload.data ?? {},
    android: {
      priority: "high",
      notification: { channelId: "shipzy_default" },
    },
  };
}

/**
 * Send a notification to a single user (silent failure).
 */
export async function sendToUser(
  userId: number,
  payload: FcmPayload,
): Promise<void> {
  if (!firebaseApp) {
    logger.warn("FCM skipped — Firebase Admin not initialized");
    return;
  }
  try {
    const tokens = await getActiveTokensForUsers([userId]);
    if (tokens.length === 0) return;
    await Promise.all(
      tokens.map(async (t) => {
        try {
          await admin.messaging().send(buildMessage(t.deviceToken, payload));
        } catch (err) {
          const code = (err as { code?: string }).code ?? "";
          if (
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token"
          ) {
            await deactivateToken(t.deviceToken);
          }
          logger.warn({
            msg: "FCM send failed for user",
            userId,
            code,
            error: (err as Error).message,
          });
        }
      }),
    );
  } catch (error) {
    logger.error({
      msg: "sendToUser failed",
      userId,
      error: (error as Error).message,
    });
  }
}

/**
 * Send a notification to multiple users in one batch (silent failure).
 */
export async function sendToUsers(
  userIds: number[],
  payload: FcmPayload,
): Promise<void> {
  if (!firebaseApp) {
    logger.warn("FCM skipped — Firebase Admin not initialized");
    return;
  }
  if (userIds.length === 0) return;
  try {
    const tokens = await getActiveTokensForUsers(userIds);
    if (tokens.length === 0) return;

    const messages = tokens.map((t) => buildMessage(t.deviceToken, payload));
    const response = await admin.messaging().sendEach(messages);

    const stale: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code ?? "";
        if (
          code === "messaging/registration-token-not-registered" ||
          code === "messaging/invalid-registration-token"
        ) {
          const token = tokens[idx];
          if (token) stale.push(token.deviceToken);
        }
      }
    });
    await Promise.all(stale.map((t) => deactivateToken(t)));

    if (response.failureCount > 0) {
      logger.warn({
        msg: "FCM multicast partial failure",
        sent: response.successCount,
        failed: response.failureCount,
        deactivated: stale.length,
      });
    }
  } catch (error) {
    logger.error({
      msg: "sendToUsers failed",
      count: userIds.length,
      error: (error as Error).message,
    });
  }
}

export default { sendToUser, sendToUsers };
