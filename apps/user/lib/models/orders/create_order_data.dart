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
    @JsonKey(name: 'deliveryTypes') required List<DeliveryType> deliveryTypes,
    @JsonKey(name: 'packageTypes') required List<PackageType> packageTypes,
    @JsonKey(name: 'paymentMethods') required List<PaymentMethod> paymentMethods,
  }) = _CreateOrderData;

  factory CreateOrderData.fromJson(Map<String, dynamic> json) => _$CreateOrderDataFromJson(json);
}

/// Delivery type model
@freezed
abstract class DeliveryType with _$DeliveryType {
  const factory DeliveryType({
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'baseRate') required double baseRate,
    @JsonKey(name: 'isActive') required bool isActive,
    @JsonKey(name: 'perKmRate') required double perKmRate,
    @JsonKey(name: 'sortOrder') required int sortOrder,
    @JsonKey(name: 'description') required String description,
    @JsonKey(name: 'displayName') required String displayName,
    @JsonKey(name: 'deliveryTypeId') required int deliveryTypeId,
    @JsonKey(name: 'supportedVehicles') required List<Vehicle> supportedVehicles,
    @JsonKey(name: 'labels') required List<Label> labels,
  }) = _DeliveryType;

  factory DeliveryType.fromJson(Map<String, dynamic> json) => _$DeliveryTypeFromJson(json);
}

/// Label for delivery types (like "NEW", "Fastest", etc.)
@freezed
abstract class Label with _$Label {
  const factory Label({
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'color') required String color,
    @JsonKey(name: 'labelId') required int labelId,
    @JsonKey(name: 'displayText') required String displayText,
    @JsonKey(name: 'backgroundColor') required String backgroundColor,
  }) = _Label;

  factory Label.fromJson(Map<String, dynamic> json) => _$LabelFromJson(json);
}

/// Vehicle model
@freezed
abstract class Vehicle with _$Vehicle {
  const factory Vehicle({
    @JsonKey(name: 'categoryId') required int categoryId,
    @JsonKey(name: 'displayName') required String displayName,
    @JsonKey(name: 'maxWeightKg') required double maxWeightKg,
    @JsonKey(name: 'weightTiers') required List<WeightTier> weightTiers,
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'iconUrl') required String? iconUrl,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);
}

/// Weight tier for pricing
@freezed
abstract class WeightTier with _$WeightTier {
  const factory WeightTier({
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'tierId') required int tierId,
    @JsonKey(name: 'maxWeightKg') required double maxWeightKg,
    @JsonKey(name: 'minWeightKg') required double minWeightKg,
    @JsonKey(name: 'additionalCharge') required double additionalCharge,
  }) = _WeightTier;

  factory WeightTier.fromJson(Map<String, dynamic> json) => _$WeightTierFromJson(json);
}

/// Package type model
@freezed
abstract class PackageType with _$PackageType {
  const factory PackageType({
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'description') required String description,
    @JsonKey(name: 'packageTypeId') required int packageTypeId,
  }) = _PackageType;

  factory PackageType.fromJson(Map<String, dynamic> json) => _$PackageTypeFromJson(json);
}

/// Payment method model
@freezed
abstract class PaymentMethod with _$PaymentMethod {
  const factory PaymentMethod({
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'isActive') required bool isActive,
    @JsonKey(name: 'methodId') required int methodId,
    @JsonKey(name: 'description') required String description,
    @JsonKey(name: 'displayName') required String displayName,
  }) = _PaymentMethod;

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);
}
