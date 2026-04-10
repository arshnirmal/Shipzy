import 'package:freezed_annotation/freezed_annotation.dart';

import 'order_address.dart';

part 'order_types.freezed.dart';
part 'order_types.g.dart';

/// Mirrors API identifiers block { orderId, orderUuid, orderNumber? }
@freezed
class OrderIdentifiers with _$OrderIdentifiers {
  const factory OrderIdentifiers({
    required int orderId,
    required String orderUuid,
    String? orderNumber,
  }) = _OrderIdentifiers;

  factory OrderIdentifiers.fromJson(Map<String, dynamic> json) => _$OrderIdentifiersFromJson(json);
}

/// Mirrors API OrderFulfillment schema
@freezed
class OrderFulfillment with _$OrderFulfillment {
  const factory OrderFulfillment({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    int? weightTierId,
    int? packageTypeId,
    int? paymentMethodId,
  }) = _OrderFulfillment;

  factory OrderFulfillment.fromJson(Map<String, dynamic> json) => _$OrderFulfillmentFromJson(json);
}

/// Mirrors API locations block { pickup, delivery }
@freezed
class OrderLocations with _$OrderLocations {
  const factory OrderLocations({
    required OrderAddress pickup,
    required OrderAddress delivery,
  }) = _OrderLocations;

  factory OrderLocations.fromJson(Map<String, dynamic> json) => _$OrderLocationsFromJson(json);
}

/// Mirrors API OrderPackage schema
@freezed
class OrderPackage with _$OrderPackage {
  const factory OrderPackage({
    String? description,
    String? specialInstructions,
    double? declaredValue,
    @Default(false) bool notifyRecipientSms,
  }) = _OrderPackage;

  factory OrderPackage.fromJson(Map<String, dynamic> json) => _$OrderPackageFromJson(json);
}

/// Mirrors API FareBreakdown schema
@freezed
class FareBreakdown with _$FareBreakdown {
  const factory FareBreakdown({
    required double basePrice,
    required double distanceKm,
    required double distancePrice,
    required double weightSurcharge,
    required double totalPrice,
    double? platformFee,
    double? subtotalBeforeTax,
    double? gstAmount,
    double? specialHandlingFee,
    String? currency,
  }) = _FareBreakdown;

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => _$FareBreakdownFromJson(json);
}

/// Mirrors API metrics block
@freezed
class OrderMetrics with _$OrderMetrics {
  const factory OrderMetrics({
    required double totalPrice,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    int? actualDurationMins,
  }) = _OrderMetrics;

  factory OrderMetrics.fromJson(Map<String, dynamic> json) => _$OrderMetricsFromJson(json);
}

/// Mirrors API timeline block
@freezed
class OrderTimeline with _$OrderTimeline {
  const factory OrderTimeline({
    required String createdAt,
    String? acceptedAt,
    String? pickedUpAt,
    String? inTransitAt,
    String? deliveredAt,
    String? cancelledAt,
  }) = _OrderTimeline;

  factory OrderTimeline.fromJson(Map<String, dynamic> json) => _$OrderTimelineFromJson(json);
}

/// Mirrors API OrderSchedule schema
@freezed
class OrderSchedule with _$OrderSchedule {
  const factory OrderSchedule({
    String? pickupAt,
    String? deliveryAt,
  }) = _OrderSchedule;

  factory OrderSchedule.fromJson(Map<String, dynamic> json) => _$OrderScheduleFromJson(json);
}
