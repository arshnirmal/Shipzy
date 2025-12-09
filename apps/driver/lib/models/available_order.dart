import 'package:freezed_annotation/freezed_annotation.dart';

import 'order_address.dart';

part 'available_order.freezed.dart';
part 'available_order.g.dart';

@freezed
class Pricing with _$Pricing {
  const factory Pricing({
    required double basePrice,
    required double distancePrice,
    required double weightSurcharge,
    required double platformFee,
    required double specialHandlingFee,
    required double gstAmount,
    required double subtotalBeforeTax,
    required double totalPrice,
  }) = _Pricing;

  factory Pricing.fromJson(Map<String, dynamic> json) => _$PricingFromJson(json);
}

@freezed
class WeightTier with _$WeightTier {
  const factory WeightTier({required int id, required String name, required double minWeightKg, required double maxWeightKg}) = _WeightTier;

  factory WeightTier.fromJson(Map<String, dynamic> json) => _$WeightTierFromJson(json);
}

@freezed
class AvailableOrder with _$AvailableOrder {
  const factory AvailableOrder({
    required int orderId,
    required String orderUuid,
    required String orderNumber,
    required String deliveryType,
    required String deliveryTypeDisplay,
    required String vehicleCategory,
    required String vehicleCategoryDisplay,
    required String packageType,
    required Pricing pricing,
    required double estimatedDistanceKm,
    required String createdAt,
    required OrderAddress pickup,
    required OrderAddress delivery,
    required double distanceFromCourierKm,
    String? packageDescription,
    WeightTier? weightTier,
    String? specialInstructions,
    @Default(60) int expiresInSeconds,
    @Default(false) bool isUrgent,
  }) = _AvailableOrder;

  const AvailableOrder._();

  factory AvailableOrder.fromJson(Map<String, dynamic> json) => _$AvailableOrderFromJson(json);

  double get pickupLatitude => pickup.latitude ?? 0.0;
  double get pickupLongitude => pickup.longitude ?? 0.0;
  double get deliveryLatitude => delivery.latitude ?? 0.0;
  double get deliveryLongitude => delivery.longitude ?? 0.0;
}
