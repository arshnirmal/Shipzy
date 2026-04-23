import 'package:freezed_annotation/freezed_annotation.dart';

import 'delivery_attempt.dart';
import 'earnings_breakdown.dart';
import 'order_address.dart';
import 'order_types.dart';

part 'active_order.freezed.dart';
part 'active_order.g.dart';

/// Mirrors API ActiveAssignment — item from GET /drivers/me/assignments
@freezed
class ActiveAssignment with _$ActiveAssignment {
  const factory ActiveAssignment({
    required AssignmentInfo assignment,
    @JsonKey(name: 'status') required AssignmentStatusData assignmentStatus,
    required AssignmentRouting routing,
    required AssignmentSnapshot snapshot,
    required AssignmentEarnings earnings,
    required AssignmentTimeline timeline,
    AssignmentPackage? package,
    AssignmentPricing? pricing,
    DeliveryAttempt? deliveryAttempt,
  }) = _ActiveAssignment;

  factory ActiveAssignment.fromJson(Map<String, dynamic> json) =>
      _$ActiveAssignmentFromJson(json);
}

/// Mirrors API assignment block { assignmentId, orderId, orderUuid?, orderNumber? }
@freezed
class AssignmentInfo with _$AssignmentInfo {
  const factory AssignmentInfo({
    required int assignmentId,
    required int orderId,
    String? orderUuid,
    String? orderNumber,
  }) = _AssignmentInfo;

  factory AssignmentInfo.fromJson(Map<String, dynamic> json) =>
      _$AssignmentInfoFromJson(json);
}

/// Mirrors API status block { order?, assignment? }
/// Named AssignmentStatusData (not AssignmentStatus) to avoid any enum naming collisions
@freezed
class AssignmentStatusData with _$AssignmentStatusData {
  const factory AssignmentStatusData({String? order, String? assignment}) =
      _AssignmentStatusData;

  factory AssignmentStatusData.fromJson(Map<String, dynamic> json) =>
      _$AssignmentStatusDataFromJson(json);
}

extension AssignmentStatusDataX on AssignmentStatusData {
  bool get isInTransit => order == AssignmentOrderStatus.inTransit;
  bool get isUndeliverable => order == AssignmentOrderStatus.undeliverable;
  bool get isReturning => order == AssignmentOrderStatus.returning;
  bool get isReturned => order == AssignmentOrderStatus.returned;
  bool get isDelivered => order == AssignmentOrderStatus.delivered;
}

/// Mirrors API routing block
@freezed
class AssignmentRouting with _$AssignmentRouting {
  const factory AssignmentRouting({
    OrderAddress? pickup,
    OrderAddress? delivery,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    @Default(0) int estimatedDeliveryMinutes,
  }) = _AssignmentRouting;

  factory AssignmentRouting.fromJson(Map<String, dynamic> json) =>
      _$AssignmentRoutingFromJson(json);
}

/// Mirrors API snapshot block
@freezed
class AssignmentSnapshot with _$AssignmentSnapshot {
  const factory AssignmentSnapshot({
    SnapshotDeliveryType? deliveryType,
    SnapshotVehicleCategory? vehicleCategory,
    SnapshotPackageType? packageType,
    SnapshotWeightTier? weightTier,
  }) = _AssignmentSnapshot;

  factory AssignmentSnapshot.fromJson(Map<String, dynamic> json) =>
      _$AssignmentSnapshotFromJson(json);
}

/// Mirrors API snapshot.deliveryType { id, name, displayName }
@freezed
class SnapshotDeliveryType with _$SnapshotDeliveryType {
  const factory SnapshotDeliveryType({
    required int id,
    required String name,
    required String displayName,
  }) = _SnapshotDeliveryType;

  factory SnapshotDeliveryType.fromJson(Map<String, dynamic> json) =>
      _$SnapshotDeliveryTypeFromJson(json);
}

/// Mirrors API snapshot.vehicleCategory { id, name, displayName, maxWeightKg? }
@freezed
class SnapshotVehicleCategory with _$SnapshotVehicleCategory {
  const factory SnapshotVehicleCategory({
    required int id,
    required String name,
    required String displayName,
    double? maxWeightKg,
  }) = _SnapshotVehicleCategory;

  factory SnapshotVehicleCategory.fromJson(Map<String, dynamic> json) =>
      _$SnapshotVehicleCategoryFromJson(json);
}

/// Mirrors API snapshot.packageType { id, name }
@freezed
class SnapshotPackageType with _$SnapshotPackageType {
  const factory SnapshotPackageType({required int id, required String name}) =
      _SnapshotPackageType;

  factory SnapshotPackageType.fromJson(Map<String, dynamic> json) =>
      _$SnapshotPackageTypeFromJson(json);
}

/// Mirrors API snapshot.weightTier — all optional per API
@freezed
class SnapshotWeightTier with _$SnapshotWeightTier {
  const factory SnapshotWeightTier({
    int? id,
    String? name,
    double? minWeightKg,
    double? maxWeightKg,
  }) = _SnapshotWeightTier;

  factory SnapshotWeightTier.fromJson(Map<String, dynamic> json) =>
      _$SnapshotWeightTierFromJson(json);
}

/// Mirrors API package block
@freezed
class AssignmentPackage with _$AssignmentPackage {
  const factory AssignmentPackage({
    String? description,
    String? specialInstructions,
    double? declaredValue,
    bool? notifyRecipientSms,
  }) = _AssignmentPackage;

  factory AssignmentPackage.fromJson(Map<String, dynamic> json) =>
      _$AssignmentPackageFromJson(json);
}

/// Mirrors API pricing block on active assignment
@freezed
class AssignmentPricing with _$AssignmentPricing {
  const factory AssignmentPricing({
    required double basePrice,
    required double distanceKm,
    required double distancePrice,
    required double weightSurcharge,
    required double platformFee,
    required double specialHandlingFee,
    required double subtotalBeforeTax,
    required double gstAmount,
    required double totalPrice,
    String? currency,
  }) = _AssignmentPricing;

  factory AssignmentPricing.fromJson(Map<String, dynamic> json) =>
      _$AssignmentPricingFromJson(json);
}

/// Mirrors API earnings block { net, breakdown }
@freezed
class AssignmentEarnings with _$AssignmentEarnings {
  const factory AssignmentEarnings({
    required double net,
    required EarningsBreakdown breakdown,
  }) = _AssignmentEarnings;

  factory AssignmentEarnings.fromJson(Map<String, dynamic> json) =>
      _$AssignmentEarningsFromJson(json);
}

/// Mirrors API timeline block { assignedAt?, acceptedAt? }
@freezed
class AssignmentTimeline with _$AssignmentTimeline {
  const factory AssignmentTimeline({String? assignedAt, String? acceptedAt}) =
      _AssignmentTimeline;

  factory AssignmentTimeline.fromJson(Map<String, dynamic> json) =>
      _$AssignmentTimelineFromJson(json);
}
