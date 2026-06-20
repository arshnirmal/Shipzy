import { z } from "zod";
import {
  AssignmentTimelineJSONBZ,
  KycJSONBZ,
  OnboardingJSONBZ,
  OrderLocationJSONBZ,
  OrderPackageJSONBZ,
  OrderPricingJSONBZ,
  OrderSnapshotJSONBZ,
} from "../database/schema/types.js";

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

export const PricingConfigRowDbZ = z.object({
  configKey: z.string(),
  configValue: z.union([z.number(), z.string()]),
});
export type PricingConfigRowDb = z.infer<typeof PricingConfigRowDbZ>;

export const PackageHandlingFeeDbZ = z.object({
  specialHandlingFee: z.union([z.number(), z.string()]),
});
export type PackageHandlingFeeDb = z.infer<typeof PackageHandlingFeeDbZ>;

/** JSONB from Postgres: object, stringified JSON, or null. */
const pgJsonb = <S extends z.ZodTypeAny>(schema: S) =>
  z.preprocess((raw: unknown) => {
    if (raw == null || raw === "") return null;
    if (typeof raw === "string") {
      try {
        return JSON.parse(raw) as unknown;
      } catch {
        return null;
      }
    }
    return raw;
  }, schema.nullable());

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
  avgRating: z.union([z.number(), z.string()]).nullable().optional(),
  totalRatings: z.number().int().nonnegative().optional(),
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
  onboarding: pgJsonb(OnboardingJSONBZ).optional(),
  kyc: pgJsonb(KycJSONBZ).optional(),
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
    assignmentStatus: z.string().nullable().optional(),

    // Whole JSONB location objects
    pickup: OrderLocationJSONBZ.nullable().optional(),
    delivery: OrderLocationJSONBZ.nullable().optional(),

    // JSONB value objects
    pricing: OrderPricingJSONBZ.nullable().optional(),
    snapshot: OrderSnapshotJSONBZ.nullable().optional(),
    package: OrderPackageJSONBZ.nullable().optional(),
    timeline: AssignmentTimelineJSONBZ.nullable().optional(),

    totalPrice: z.union([z.number(), z.string()]).nullable().optional(),
    paymentMode: z.string().nullable().optional(),
    paymentStatus: z.string().nullable().optional(),
    estimatedDistanceKm: z
      .union([z.number(), z.string()])
      .nullable()
      .optional(),
    actualDistanceKm: z.union([z.number(), z.string()]).nullable().optional(),
    assignedAt: z.date().nullable().optional(),
  })
  .passthrough();
export type CourierAssignmentDb = z.infer<typeof CourierAssignmentDbZ>;

export const TripHistoryRowDbZ = z.object({
  assignmentId: z.number().int().positive(),
  orderId: z.number().int().positive(),
  orderUuid: z.string().uuid().nullable().optional(),
  orderNumber: z.string().nullable().optional(),
  orderStatus: z.string(),
  assignmentStatus: z.string(),
  pickup: OrderLocationJSONBZ.nullable().optional(),
  delivery: OrderLocationJSONBZ.nullable().optional(),
  actualDistanceKm: z.union([z.number(), z.string()]).nullable().optional(),
  totalPrice: z.union([z.number(), z.string()]).nullable().optional(),
  netEarning: z.union([z.number(), z.string()]),
  snapshot: OrderSnapshotJSONBZ.nullable().optional(),
  assignedAt: z.date().nullable().optional(),
  deliveredAt: z.date().nullable().optional(),
  cancelledAt: z.date().nullable().optional(),
  totalCount: z.union([z.number(), z.string()]),
});
export type TripHistoryRowDb = z.infer<typeof TripHistoryRowDbZ>;

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
export type AddTrackingEventResultDb = z.infer<
  typeof AddTrackingEventResultDbZ
>;

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
export type MarkPaymentCompletedResultDb = z.infer<
  typeof MarkPaymentCompletedResultDbZ
>;

export const MarkPaymentFailedResultDbZ = z.object({
  transactionId: z.number().int().positive(),
  paymentFailedAt: z.date(),
});
export type MarkPaymentFailedResultDb = z.infer<
  typeof MarkPaymentFailedResultDbZ
>;

export const MarkRefundProcessedResultDbZ = z.object({
  refundId: z.number().int().positive(),
  processedAt: z.date(),
});
export type MarkRefundProcessedResultDb = z.infer<
  typeof MarkRefundProcessedResultDbZ
>;

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
export type QueueNotificationResultDb = z.infer<
  typeof QueueNotificationResultDbZ
>;

export const MarkNotificationSentResultDbZ = z.object({
  notificationId: z.number().int().positive(),
  sentAt: z.date(),
});
export type MarkNotificationSentResultDb = z.infer<
  typeof MarkNotificationSentResultDbZ
>;

export const MarkNotificationFailedResultDbZ = z.object({
  notificationId: z.number().int().positive(),
  retryCount: z.number().int().nonnegative(),
});
export type MarkNotificationFailedResultDb = z.infer<
  typeof MarkNotificationFailedResultDbZ
>;

export const SaveFcmTokenResultDbZ = z.object({
  tokenId: z.number().int().positive(),
  deviceToken: z.string(),
});
export type SaveFcmTokenResultDb = z.infer<typeof SaveFcmTokenResultDbZ>;

export const DeactivateFcmTokenResultDbZ = z.object({
  tokenId: z.number().int().positive(),
});
export type DeactivateFcmTokenResultDb = z.infer<
  typeof DeactivateFcmTokenResultDbZ
>;

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
  isAnonymous: z.boolean().optional(),
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

// ============================================================================
// STATIC DATA
// ============================================================================

export const StaticWeightTierDbZ = z.object({
  tierId: z.number().int().positive(),
  name: z.string(),
  minWeightKg: z.union([z.number(), z.string()]),
  maxWeightKg: z.union([z.number(), z.string()]),
  additionalCharge: z.union([z.number(), z.string()]),
});
export type StaticWeightTierDb = z.infer<typeof StaticWeightTierDbZ>;

export const StaticSupportedVehicleDbZ = z.object({
  categoryId: z.number().int().positive(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  maxWeightKg: z.union([z.number(), z.string()]),
  iconUrl: z.string().nullable().optional(),
  weightTiers: z.array(StaticWeightTierDbZ),
});
export type StaticSupportedVehicleDb = z.infer<
  typeof StaticSupportedVehicleDbZ
>;

export const StaticDeliveryTypeDbZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  baseRate: z.union([z.number(), z.string()]),
  perKmRate: z.union([z.number(), z.string()]),
  sortOrder: z.union([z.number(), z.string()]),
  isActive: z.boolean(),
  supportedVehicles: z.array(StaticSupportedVehicleDbZ),
});
export type StaticDeliveryTypeDb = z.infer<typeof StaticDeliveryTypeDbZ>;

export const StaticDeliveryTypeMasterDbZ = z.object({
  deliveryTypeId: z.number().int().positive(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  baseRate: z.union([z.number(), z.string()]),
  perKmRate: z.union([z.number(), z.string()]),
  sortOrder: z.union([z.number(), z.string()]),
  isActive: z.boolean(),
});
export type StaticDeliveryTypeMasterDb = z.infer<
  typeof StaticDeliveryTypeMasterDbZ
>;

export const StaticVehicleCategoryDbZ = z.object({
  categoryId: z.number().int().positive(),
  name: z.string(),
  displayName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  maxWeightKg: z.union([z.number(), z.string()]),
  iconUrl: z.string().nullable().optional(),
  isActive: z.boolean(),
});
export type StaticVehicleCategoryDb = z.infer<typeof StaticVehicleCategoryDbZ>;

export const StaticPackageTypeDbZ = z.object({
  packageTypeId: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable().optional(),
});
export type StaticPackageTypeDb = z.infer<typeof StaticPackageTypeDbZ>;

export const StaticPaymentMethodDbZ = z.object({
  methodId: z.number().int().positive(),
  name: z.string(),
  description: z.string().nullable().optional(),
  isActive: z.boolean(),
});
export type StaticPaymentMethodDb = z.infer<typeof StaticPaymentMethodDbZ>;

export const StaticStatusRowDbZ = z.object({
  name: z.string(),
});
export type StaticStatusRowDb = z.infer<typeof StaticStatusRowDbZ>;

export const StaticCreateOrderDataDbZ = z.object({
  deliveryTypes: z.array(StaticDeliveryTypeDbZ),
  packageTypes: z.array(StaticPackageTypeDbZ),
  paymentMethods: z.array(StaticPaymentMethodDbZ),
});
export type StaticCreateOrderDataDb = z.infer<typeof StaticCreateOrderDataDbZ>;
