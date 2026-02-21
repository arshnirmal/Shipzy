// services/backend/src/database/schema/notifications.ts
// Notifications schema: queue, FCM tokens

import {
  pgTable,
  pgSchema,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { userProfiles } from "./users.js";
import {
  notificationChannels,
  notificationStatuses,
} from "./public.js";

const notificationsSchema = pgSchema("notifications");

// Notification Queue
export const notificationQueue = notificationsSchema.table("queue", {
  notificationId: serial("notification_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  channelId: integer("channel_id")
    .notNull()
    .references(() => notificationChannels.channelId),
  statusId: integer("status_id")
    .notNull()
    .references(() => notificationStatuses.statusId),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: jsonb("data"),
  priority: varchar("priority", { length: 20 }).default("normal").notNull(),
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
});

// FCM Tokens
export const fcmTokens = notificationsSchema.table("fcm_tokens", {
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
});
