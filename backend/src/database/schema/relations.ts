// services/backend/src/database/schema/relations.ts
// Drizzle relations for foreign key relationships

import { relations } from "drizzle-orm";
import {
  userProfiles,
  userAddresses,
  authSessions,
  businessAccounts,
} from "./users.js";
import {
  orderRequests,
  courierAssignments,
  proofOfDelivery,
} from "./orders.js";
import {
  courierStatus,
  courierVehicles,
  locations,
  driverSessions,
} from "./logistics.js";
import { paymentTransactions, refunds } from "./payments.js";
import { trackingEvents } from "./tracking.js";
import { driverRatings } from "./ratings.js";
import { notificationQueue, fcmTokens } from "./notifications.js";

// User Relations
export const userProfilesRelations = relations(userProfiles, ({ many }) => ({
  addresses: many(userAddresses),
  authSessions: many(authSessions),
  businessAccount: many(businessAccounts),
  orders: many(orderRequests, { relationName: "clientOrders" }),
  courierAssignments: many(courierAssignments),
  courierStatus: many(courierStatus),
  courierVehicles: many(courierVehicles),
  trackingEvents: many(trackingEvents),
  notifications: many(notificationQueue),
  fcmTokens: many(fcmTokens),
  driverRatingsAsCustomer: many(driverRatings, {
    relationName: "customerRatings",
  }),
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

export const businessAccountsRelations = relations(
  businessAccounts,
  ({ one }) => ({
    user: one(userProfiles, {
      fields: [businessAccounts.userId],
      references: [userProfiles.userId],
    }),
  }),
);

// Order Relations
export const orderRequestsRelations = relations(orderRequests, ({ many }) => ({
  courierAssignments: many(courierAssignments),
  proofOfDelivery: many(proofOfDelivery),
  paymentTransactions: many(paymentTransactions),
  refunds: many(refunds),
  trackingEvents: many(trackingEvents),
  driverRatings: many(driverRatings),
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
    proofOfDelivery: many(proofOfDelivery),
    trackingEvents: many(trackingEvents),
  }),
);

export const proofOfDeliveryRelations = relations(
  proofOfDelivery,
  ({ one }) => ({
    order: one(orderRequests, {
      fields: [proofOfDelivery.orderId],
      references: [orderRequests.orderId],
    }),
    assignment: one(courierAssignments, {
      fields: [proofOfDelivery.assignmentId],
      references: [courierAssignments.assignmentId],
    }),
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
  vehicles: many(courierVehicles),
  driverSessions: many(driverSessions),
  driverRatings: many(driverRatings),
}));

export const courierVehiclesRelations = relations(
  courierVehicles,
  ({ one }) => ({
    courier: one(userProfiles, {
      fields: [courierVehicles.courierId],
      references: [userProfiles.userId],
    }),
  }),
);

export const driverSessionsRelations = relations(driverSessions, ({ one }) => ({
  driver: one(courierStatus, {
    fields: [driverSessions.driverId],
    references: [courierStatus.courierId],
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

// Ratings Relations
export const driverRatingsRelations = relations(driverRatings, ({ one }) => ({
  order: one(orderRequests, {
    fields: [driverRatings.orderId],
    references: [orderRequests.orderId],
  }),
  driver: one(courierStatus, {
    fields: [driverRatings.driverId],
    references: [courierStatus.courierId],
  }),
  customer: one(userProfiles, {
    fields: [driverRatings.customerId],
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
