// services/backend/src/database/schema/users.ts
// Users schema: profiles, auth_sessions, addresses, business_accounts

import {
  pgTable,
  pgSchema,
  serial,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  timestamp,
  inet,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { userRoles } from "./public.js";
import { geographyPoint4326 as geography } from "./postgisGeography.js";

const usersSchema = pgSchema("users");

// User Profiles
export const userProfiles = usersSchema.table("profiles", {
  userId: serial("user_id").primaryKey(),
  userUuid: uuid("user_uuid").defaultRandom().notNull().unique(),
  roleId: integer("role_id")
    .notNull()
    .references(() => userRoles.roleId),
  firebaseUid: varchar("firebase_uid", { length: 255 }).unique(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  email: varchar("email", { length: 100 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  profilePictureUrl: varchar("profile_picture_url", { length: 255 }),
  isVerified: boolean("is_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Auth Sessions
export const authSessions = usersSchema.table("auth_sessions", {
  sessionId: serial("session_id").primaryKey(),
  userId: integer("user_id").references(() => userProfiles.userId, {
    onDelete: "cascade",
  }),
  email: varchar("email", { length: 100 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  otpCode: varchar("otp_code", { length: 6 }),
  otpExpiresAt: timestamp("otp_expires_at", { withTimezone: true }),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationAttempts: integer("verification_attempts").default(0).notNull(),
  jwtTokenHash: varchar("jwt_token_hash", { length: 255 }).notNull().unique(),
  deviceId: varchar("device_id", { length: 255 }),
  deviceInfo: jsonb("device_info"),
  ipAddress: inet("ip_address"),
  authMethod: varchar("auth_method", { length: 20 }).default("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  lastActivityAt: timestamp("last_activity_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// User Addresses (for saved addresses - uses PostGIS)
export const userAddresses = usersSchema.table("addresses", {
  addressId: serial("address_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  addressType: varchar("address_type", { length: 50 }),
  label: varchar("label", { length: 100 }),
  building: varchar("building", { length: 100 }),
  floor: varchar("floor", { length: 10 }),
  flatNumber: varchar("flat_number", { length: 10 }),
  fullAddress: text("full_address").notNull(),
  landmark: varchar("landmark", { length: 255 }),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  postalCode: varchar("postal_code", { length: 20 }).notNull(),
  country: varchar("country", { length: 100 }).default("India").notNull(),
  location: geography("location").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Business Accounts
export const businessAccounts = usersSchema.table("business_accounts", {
  businessId: serial("business_id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => userProfiles.userId, { onDelete: "cascade" }),
  businessName: varchar("business_name", { length: 200 }).notNull(),
  gstNumber: varchar("gst_number", { length: 15 }).unique(),
  panNumber: varchar("pan_number", { length: 10 }),
  businessType: varchar("business_type", { length: 100 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
