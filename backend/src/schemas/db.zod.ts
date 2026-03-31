import { z } from "zod";

// ============================================================================
// DB ROW SCHEMAS - Internal camelCase row shapes
// ============================================================================

export const UserProfileDbZ = z.object({
  userId: z.number().int().positive(),
  userUuid: z.string(),
  roleName: z.string(),
  phoneNumber: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  fullName: z.string(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserProfileDb = z.infer<typeof UserProfileDbZ>;

export const AuthUserDbZ = UserProfileDbZ.extend({
  firebaseUid: z.string().nullable().optional(),
  profileComplete: z.boolean().optional(),
  passwordHash: z.string().nullable().optional(),
});
export type AuthUserDb = z.infer<typeof AuthUserDbZ>;

export const RequestUserZ = z.object({
  userId: z.number().int().positive(),
  userUuid: z.string(),
  role: z.string(),
  phoneNumber: z.string().nullable().optional(),
});
export type RequestUser = z.infer<typeof RequestUserZ>;

export const CourierDbZ = z.object({
  courierId: z.number().int().positive(),
  userId: z.number().int().positive(),
  userUuid: z.string(),
  fullName: z.string(),
  email: z.string().email().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
  profilePictureUrl: z.string().nullable().optional(),
  isVerified: z.boolean(),
  isActive: z.boolean(),
  isAvailable: z.boolean(),
  isOnline: z.boolean(),
  currentLatitude: z.union([z.number(), z.string()]).nullable().optional(),
  currentLongitude: z.union([z.number(), z.string()]).nullable().optional(),
  lastLocationUpdate: z.date().nullable().optional(),
  totalDeliveriesToday: z.number().int().nonnegative(),
  vehicleId: z.number().int().positive().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  vehicleModel: z.string().nullable().optional(),
  vehicleYear: z.number().int().nullable().optional(),
  vehicleCategoryId: z.number().int().nullable().optional(),
  vehicleCategory: z.string().nullable().optional(),
  vehicleIsActive: z.boolean().nullable().optional(),
  vehicleMaxWeight: z.union([z.number(), z.string()]).nullable().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  roleName: z.string().optional(),
});
export type CourierDb = z.infer<typeof CourierDbZ>;

export const CourierAvailabilityDbZ = z.object({
  courierId: z.number().int().positive(),
  isAvailable: z.boolean(),
  isOnline: z.boolean(),
  updatedAt: z.date(),
});
export type CourierAvailabilityDb = z.infer<typeof CourierAvailabilityDbZ>;

export const CourierLocationDbZ = z.object({
  courierId: z.number().int().positive(),
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
  lastLocationUpdate: z.date(),
});
export type CourierLocationDb = z.infer<typeof CourierLocationDbZ>;

export const EarningsSummaryDbZ = z.object({
  totalDeliveries: z.union([z.number(), z.string()]),
  todayDeliveries: z.union([z.number(), z.string()]),
  weekDeliveries: z.union([z.number(), z.string()]),
  monthDeliveries: z.union([z.number(), z.string()]),
  totalEarnings: z.union([z.number(), z.string()]),
  todayEarnings: z.union([z.number(), z.string()]),
  weekEarnings: z.union([z.number(), z.string()]),
  monthEarnings: z.union([z.number(), z.string()]),
  avgOrderValue: z.union([z.number(), z.string()]),
  totalDistanceKm: z.union([z.number(), z.string()]),
});
export type EarningsSummaryDb = z.infer<typeof EarningsSummaryDbZ>;

export const CourierAssignmentDbZ = z
  .object({
    assignmentId: z.number().int().positive(),
    orderId: z.number().int().positive(),
    orderUuid: z.string().uuid().nullable().optional(),
    orderNumber: z.string().nullable().optional(),
    orderStatus: z.string().nullable().optional(),
    assignmentStatusId: z.number().int().nullable().optional(),
    assignmentStatus: z.string().nullable().optional(),
    vehicleCategory: z.string().nullable().optional(),
    vehicleCategoryDisplay: z.string().nullable().optional(),
    packageType: z.string().nullable().optional(),
    weightTierId: z.number().int().nullable().optional(),
    weightTierName: z.string().nullable().optional(),
    weightTierMin: z.union([z.number(), z.string()]).nullable().optional(),
    weightTierMax: z.union([z.number(), z.string()]).nullable().optional(),
    pickupAddress: z.string().nullable().optional(),
    pickupBuilding: z.string().nullable().optional(),
    pickupLandmark: z.string().nullable().optional(),
    pickupCity: z.string().nullable().optional(),
    pickupState: z.string().nullable().optional(),
    pickupPostalCode: z.string().nullable().optional(),
    pickupLatitude: z.union([z.number(), z.string()]).nullable().optional(),
    pickupLongitude: z.union([z.number(), z.string()]).nullable().optional(),
    pickupContactName: z.string().nullable().optional(),
    pickupContactPhone: z.string().nullable().optional(),
    deliveryAddress: z.string().nullable().optional(),
    deliveryBuilding: z.string().nullable().optional(),
    deliveryLandmark: z.string().nullable().optional(),
    deliveryCity: z.string().nullable().optional(),
    deliveryState: z.string().nullable().optional(),
    deliveryPostalCode: z.string().nullable().optional(),
    deliveryLatitude: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryLongitude: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryContactName: z.string().nullable().optional(),
    deliveryContactPhone: z.string().nullable().optional(),
    packageDescription: z.string().nullable().optional(),
    specialInstructions: z.string().nullable().optional(),
    declaredValue: z.union([z.number(), z.string()]).nullable().optional(),
    estimatedDistanceKm: z
      .union([z.number(), z.string()])
      .nullable()
      .optional(),
    actualDistanceKm: z.union([z.number(), z.string()]).nullable().optional(),
    deliveryType: z.string().nullable().optional(),
    basePrice: z.union([z.number(), z.string()]).nullable().optional(),
    distancePrice: z.union([z.number(), z.string()]).nullable().optional(),
    weightSurcharge: z.union([z.number(), z.string()]).nullable().optional(),
    platformFee: z.union([z.number(), z.string()]).nullable().optional(),
    specialHandlingFee: z.union([z.number(), z.string()]).nullable().optional(),
    gstAmount: z.union([z.number(), z.string()]).nullable().optional(),
    subtotalBeforeTax: z.union([z.number(), z.string()]).nullable().optional(),
    totalPrice: z.union([z.number(), z.string()]).nullable().optional(),
    assignedAt: z.date().nullable().optional(),
    acceptedAt: z.date().nullable().optional(),
  })
  .passthrough();
export type CourierAssignmentDb = z.infer<typeof CourierAssignmentDbZ>;

// ============================================================================
// TRACKING
// ============================================================================

export const TrackingEventDbZ = z.object({
  eventId: z.number().int().positive(),
  eventType: z.string(),
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
  speedKmph: z.union([z.number(), z.string()]).nullable().optional(),
  bearingDegrees: z.union([z.number(), z.string()]).nullable().optional(),
  accuracyMeters: z.union([z.number(), z.string()]).nullable().optional(),
  timestamp: z.date(),
});
export type TrackingEventDb = z.infer<typeof TrackingEventDbZ>;

export const AddTrackingEventResultDbZ = z.object({
  eventId: z.number().int().positive(),
  timestamp: z.date(),
});
export type AddTrackingEventResultDb = z.infer<typeof AddTrackingEventResultDbZ>;

export const TrackingCountDbZ = z.object({
  totalEvents: z.union([z.number(), z.string()]),
});
export type TrackingCountDb = z.infer<typeof TrackingCountDbZ>;

// ============================================================================
// PAYMENTS
// ============================================================================

export const PaymentTransactionDbZ = z.object({
  transactionId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  amount: z.union([z.number(), z.string()]),
  currency: z.string(),
  externalTransactionId: z.string().nullable().optional(),
  paymentGateway: z.string().nullable().optional(),
  upiVpa: z.string().nullable().optional(),
  paymentStatus: z.string(),
  paymentMethod: z.string(),
  paymentInitiatedAt: z.date().nullable().optional(),
  paymentCompletedAt: z.date().nullable().optional(),
  paymentFailedAt: z.date().nullable().optional(),
  failureReason: z.string().nullable().optional(),
});
export type PaymentTransactionDb = z.infer<typeof PaymentTransactionDbZ>;

export const RefundDbZ = z.object({
  refundId: z.number().int().positive(),
  transactionId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  refundAmount: z.union([z.number(), z.string()]),
  refundReason: z.string().nullable().optional(),
  refundStatus: z.string(),
  externalRefundId: z.string().nullable().optional(),
  initiatedAt: z.date().nullable().optional(),
  processedAt: z.date().nullable().optional(),
});
export type RefundDb = z.infer<typeof RefundDbZ>;

export const CreatePaymentResultDbZ = z.object({
  transactionId: z.number().int().positive(),
  paymentInitiatedAt: z.date(),
});
export type CreatePaymentResultDb = z.infer<typeof CreatePaymentResultDbZ>;

export const MarkPaymentCompletedResultDbZ = z.object({
  transactionId: z.number().int().positive(),
  paymentCompletedAt: z.date(),
});
export type MarkPaymentCompletedResultDb = z.infer<typeof MarkPaymentCompletedResultDbZ>;

export const MarkPaymentFailedResultDbZ = z.object({
  transactionId: z.number().int().positive(),
  paymentFailedAt: z.date(),
});
export type MarkPaymentFailedResultDb = z.infer<typeof MarkPaymentFailedResultDbZ>;

export const MarkRefundProcessedResultDbZ = z.object({
  refundId: z.number().int().positive(),
  processedAt: z.date(),
});
export type MarkRefundProcessedResultDb = z.infer<typeof MarkRefundProcessedResultDbZ>;

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const PendingNotificationDbZ = z.object({
  notificationId: z.number().int().positive(),
  userId: z.number().int().positive(),
  channel: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.record(z.string(), z.unknown()).nullable().optional(),
  priority: z.string().nullable().optional(),
  retryCount: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type PendingNotificationDb = z.infer<typeof PendingNotificationDbZ>;

export const FcmTokenDbZ = z.object({
  tokenId: z.number().int().positive(),
  deviceToken: z.string(),
  deviceType: z.string().nullable().optional(),
  deviceInfo: z.record(z.string(), z.unknown()).nullable().optional(),
  lastUsedAt: z.date().nullable().optional(),
});
export type FcmTokenDb = z.infer<typeof FcmTokenDbZ>;

export const QueueNotificationResultDbZ = z.object({
  notificationId: z.number().int().positive(),
  createdAt: z.date(),
});
export type QueueNotificationResultDb = z.infer<typeof QueueNotificationResultDbZ>;

export const MarkNotificationSentResultDbZ = z.object({
  notificationId: z.number().int().positive(),
  sentAt: z.date(),
});
export type MarkNotificationSentResultDb = z.infer<typeof MarkNotificationSentResultDbZ>;

export const MarkNotificationFailedResultDbZ = z.object({
  notificationId: z.number().int().positive(),
  retryCount: z.number().int().nonnegative(),
});
export type MarkNotificationFailedResultDb = z.infer<typeof MarkNotificationFailedResultDbZ>;

export const SaveFcmTokenResultDbZ = z.object({
  tokenId: z.number().int().positive(),
  deviceToken: z.string(),
});
export type SaveFcmTokenResultDb = z.infer<typeof SaveFcmTokenResultDbZ>;

export const DeactivateFcmTokenResultDbZ = z.object({
  tokenId: z.number().int().positive(),
});
export type DeactivateFcmTokenResultDb = z.infer<typeof DeactivateFcmTokenResultDbZ>;

// ============================================================================
// SESSIONS
// ============================================================================

export const DriverSessionDbZ = z.object({
  sessionId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  startedAt: z.date(),
  endedAt: z.date().nullable().optional(),
  totalOnlineMinutes: z.union([z.number(), z.string()]).nullable().optional(),
  lastLocationLat: z.union([z.number(), z.string()]).nullable().optional(),
  lastLocationLng: z.union([z.number(), z.string()]).nullable().optional(),
  createdAt: z.date(),
});
export type DriverSessionDb = z.infer<typeof DriverSessionDbZ>;

// ============================================================================
// RATINGS
// ============================================================================

export const RatingRowDbZ = z.object({
  ratingId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  driverId: z.number().int().positive(),
  customerId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  createdAt: z.date(),
  orderNumber: z.string().nullable().optional(),
  deliveredAt: z.date().nullable().optional(),
});
export type RatingRowDb = z.infer<typeof RatingRowDbZ>;

// ============================================================================
// USER ADDRESSES
// ============================================================================

export const UserAddressDbZ = z.object({
  addressId: z.number().int().positive(),
  userId: z.number().int().positive().optional(),
  addressType: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  fullAddress: z.string(),
  building: z.string().nullable().optional(),
  floor: z.string().nullable().optional(),
  flatNumber: z.string().nullable().optional(),
  landmark: z.string().nullable().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  latitude: z.union([z.number(), z.string()]),
  longitude: z.union([z.number(), z.string()]),
  isDefault: z.boolean(),
  createdAt: z.date().optional(),
});
export type UserAddressDb = z.infer<typeof UserAddressDbZ>;

export const SaveAddressResultDbZ = z.object({
  addressId: z.number().int().positive(),
  label: z.string().nullable().optional(),
  fullAddress: z.string(),
  isDefault: z.boolean(),
  createdAt: z.date(),
});
export type SaveAddressResultDb = z.infer<typeof SaveAddressResultDbZ>;
