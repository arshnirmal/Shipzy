// services/backend/src/database/schema/relations.ts
// Drizzle relations for foreign key relationships

import { relations } from "drizzle-orm";
import { userProfiles, userAddresses, authSessions } from "./users.js";
import { orderRequests, courierAssignments } from "./orders.js";
import { courierStatus, driverSessions } from "./logistics.js";
import { vehicleCategories } from "./public.js";
import { paymentTransactions, refunds } from "./payments.js";
import { trackingEvents } from "./tracking.js";
import { notificationQueue, fcmTokens } from "./notifications.js";

// User Relations
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  addresses: many(userAddresses),
  authSessions: many(authSessions),
  orders: many(orderRequests, { relationName: "clientOrders" }),
  courierAssignments: many(courierAssignments),
  courierStatus: many(courierStatus),
  trackingEvents: many(trackingEvents),
  notifications: many(notificationQueue),
  fcmTokens: many(fcmTokens),
}));

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
  user: one(userProfiles, {
    fields: [userAddresses.userId],
    references: [userProfiles.userId],
  }),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(userProfiles, {
    fields: [authSessions.userId],
    references: [userProfiles.userId],
  }),
}));

// Order Relations
export const orderRequestsRelations = relations(orderRequests, ({ many }) => ({
  courierAssignments: many(courierAssignments),
  paymentTransactions: many(paymentTransactions),
  refunds: many(refunds),
  trackingEvents: many(trackingEvents),
}));

export const courierAssignmentsRelations = relations(
  courierAssignments,
  ({ one, many }) => ({
    order: one(orderRequests, {
      fields: [courierAssignments.orderId],
      references: [orderRequests.orderId],
    }),
    courier: one(userProfiles, {
      fields: [courierAssignments.courierId],
      references: [userProfiles.userId],
    }),
    trackingEvents: many(trackingEvents),
  }),
);

// Logistics Relations
export const courierStatusRelations = relations(courierStatus, ({ one, many }) => ({
  courier: one(userProfiles, {
    fields: [courierStatus.courierId],
    references: [userProfiles.userId],
  }),
  currentAssignment: one(courierAssignments, {
    fields: [courierStatus.currentAssignmentId],
    references: [courierAssignments.assignmentId],
  }),
  vehicleCategory: one(vehicleCategories, {
    fields: [courierStatus.vehicleCategoryId],
    references: [vehicleCategories.categoryId],
  }),
  driverSessions: many(driverSessions),
}));

export const driverSessionsRelations = relations(driverSessions, ({ one }) => ({
  driver: one(userProfiles, {
    fields: [driverSessions.driverId],
    references: [userProfiles.userId],
  }),
}));

// Payment Relations
export const paymentTransactionsRelations = relations(
  paymentTransactions,
  ({ one, many }) => ({
    order: one(orderRequests, {
      fields: [paymentTransactions.orderId],
      references: [orderRequests.orderId],
    }),
    refunds: many(refunds),
  }),
);

export const refundsRelations = relations(refunds, ({ one }) => ({
  transaction: one(paymentTransactions, {
    fields: [refunds.transactionId],
    references: [paymentTransactions.transactionId],
  }),
  order: one(orderRequests, {
    fields: [refunds.orderId],
    references: [orderRequests.orderId],
  }),
}));

// Tracking Relations
export const trackingEventsRelations = relations(trackingEvents, ({ one }) => ({
  assignment: one(courierAssignments, {
    fields: [trackingEvents.assignmentId],
    references: [courierAssignments.assignmentId],
  }),
  order: one(orderRequests, {
    fields: [trackingEvents.orderId],
    references: [orderRequests.orderId],
  }),
  courier: one(userProfiles, {
    fields: [trackingEvents.courierId],
    references: [userProfiles.userId],
  }),
}));

// Notification Relations
export const notificationQueueRelations = relations(
  notificationQueue,
  ({ one }) => ({
    user: one(userProfiles, {
      fields: [notificationQueue.userId],
      references: [userProfiles.userId],
    }),
  }),
);

export const fcmTokensRelations = relations(fcmTokens, ({ one }) => ({
  user: one(userProfiles, {
    fields: [fcmTokens.userId],
    references: [userProfiles.userId],
  }),
}));
