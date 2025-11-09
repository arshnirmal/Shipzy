// lib/models/orders/create_order_data.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_order_data.freezed.dart';
part 'create_order_data.g.dart';

/// Response for create order data endpoint
@freezed
abstract class CreateOrderDataResponse with _$CreateOrderDataResponse {
  const factory CreateOrderDataResponse({required bool success, required String message, required CreateOrderData data, required String timestamp}) =
      _CreateOrderDataResponse;

  factory CreateOrderDataResponse.fromJson(Map<String, dynamic> json) => _$CreateOrderDataResponseFromJson(json);
}

/// Main data structure for create order data
@freezed
abstract class CreateOrderData with _$CreateOrderData {
  const factory CreateOrderData({
    required List<DeliveryType> deliveryTypes,
    required List<PackageType> packageTypes,
    required List<PaymentMethod> paymentMethods,
  }) = _CreateOrderData;

  factory CreateOrderData.fromJson(Map<String, dynamic> json) => _$CreateOrderDataFromJson(json);
}

/// Delivery type model
@freezed
abstract class DeliveryType with _$DeliveryType {
  const factory DeliveryType({
    required String name,
    required List<Label> labels,
    required double baseRate,
    required bool isActive,
    required double perKmRate,
    required int sortOrder,
    required String description,
    required String displayName,
    required int deliveryTypeId,
    required List<Vehicle> supportedVehicles,
  }) = _DeliveryType;

  factory DeliveryType.fromJson(Map<String, dynamic> json) => _$DeliveryTypeFromJson(json);
}

/// Label for delivery types (like "NEW", "Fastest", etc.)
@freezed
abstract class Label with _$Label {
  const factory Label({
    required String name,
    required String color,
    required int labelId,
    required String displayText,
    required String backgroundColor,
  }) = _Label;

  factory Label.fromJson(Map<String, dynamic> json) => _$LabelFromJson(json);
}

/// Vehicle model
@freezed
abstract class Vehicle with _$Vehicle {
  const factory Vehicle({
    required int categoryId,
    required String displayName,
    required double maxWeightKg,
    required List<WeightTier> weightTiers,
    required String name,
    String? iconUrl,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);
}

/// Weight tier for pricing
@freezed
abstract class WeightTier with _$WeightTier {
  const factory WeightTier({
    required String name,
    required int tierId,
    required double maxWeightKg,
    required double minWeightKg,
    required double additionalCharge,
  }) = _WeightTier;

  factory WeightTier.fromJson(Map<String, dynamic> json) => _$WeightTierFromJson(json);
}

/// Package type model
@freezed
abstract class PackageType with _$PackageType {
  const factory PackageType({required String name, required String description, required int packageTypeId}) = _PackageType;

  factory PackageType.fromJson(Map<String, dynamic> json) => _$PackageTypeFromJson(json);
}

/// Payment method model
@freezed
abstract class PaymentMethod with _$PaymentMethod {
  const factory PaymentMethod({
    required String name,
    required bool isActive,
    required int methodId,
    required String description,
    required String displayName,
  }) = _PaymentMethod;

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);
}
