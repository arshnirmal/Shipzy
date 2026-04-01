// services/backend/src/database/schema/notifications.ts
// Notifications schema: queue, FCM tokens

import {
  pgTable,
  pgSchema,
  serial,
  index,
  check,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userProfiles } from "./users.js";
import {
  notificationChannelEnum,
  notificationStatusEnum,
  notificationPriorityEnum,
} from "./public.js";

const notificationsSchema = pgSchema("notifications");

// Notification Queue
export const notificationQueue = notificationsSchema.table(
  "queue",
  {
    notificationId: serial("notification_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    title: varchar("title", { length: 255 }).notNull(),
    body: text("body").notNull(),
    data: jsonb("data"),
    priority: notificationPriorityEnum("priority").default("normal").notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    retryCount: integer("retry_count").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("notifications_queue_retry_count_non_negative_chk", sql`${table.retryCount} >= 0`),
    check("notifications_queue_max_retries_non_negative_chk", sql`${table.maxRetries} >= 0`),
    index("idx_notifications_user_unread")
      .on(table.userId, table.status)
      .where(sql`${table.status} NOT IN ('read', 'failed')`),
  ],
);

// FCM Tokens
export const fcmTokens = notificationsSchema.table(
  "fcm_tokens",
  {
    tokenId: serial("token_id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => userProfiles.userId, { onDelete: "cascade" }),
    deviceToken: text("device_token").notNull(),
    deviceType: varchar("device_type", { length: 20 }).notNull(),
    deviceInfo: jsonb("device_info"),
    isActive: boolean("is_active").default(true).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("idx_fcm_tokens_user_active")
      .on(table.userId)
      .where(sql`${table.isActive} = true`),
  ],
);
