import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_order_data.freezed.dart';
part 'create_order_data.g.dart';

@freezed
abstract class CreateOrderDataResponse with _$CreateOrderDataResponse {
  const factory CreateOrderDataResponse({
    required bool success,
    required String message,
    required CreateOrderDataPayload data,
    required String timestamp,
  }) = _CreateOrderDataResponse;

  factory CreateOrderDataResponse.fromJson(Map<String, dynamic> json) => _$CreateOrderDataResponseFromJson(json);
}

@freezed
abstract class CreateOrderDataPayload with _$CreateOrderDataPayload {
  const factory CreateOrderDataPayload({required CreateOrderData createOrder}) = _CreateOrderDataPayload;

  factory CreateOrderDataPayload.fromJson(Map<String, dynamic> json) => _$CreateOrderDataPayloadFromJson(json);
}

@freezed
abstract class CreateOrderData with _$CreateOrderData {
  const factory CreateOrderData({
    required List<DeliveryType> deliveryTypes,
    required List<PackageType> packageTypes,
    required List<PaymentMethod> paymentMethods,
  }) = _CreateOrderData;

  factory CreateOrderData.fromJson(Map<String, dynamic> json) => _$CreateOrderDataFromJson(json);
}

@freezed
abstract class DeliveryType with _$DeliveryType {
  const factory DeliveryType({
    required int deliveryTypeId,
    required String name,
    required DeliveryTypePricing pricing,
    required List<Vehicle> supportedVehicles,
    required int sortOrder,
    required bool isActive,
    @Default('') String displayName,
    @Default('') String description,
    @Default(<Label>[]) List<Label> labels,
  }) = _DeliveryType;

  const DeliveryType._();

  factory DeliveryType.fromJson(Map<String, dynamic> json) => _$DeliveryTypeFromJson(json);

  double get baseRate => pricing.baseRate;
}

@freezed
abstract class Label with _$Label {
  const factory Label({
    @Default('') String name,
    @Default('') String color,
    @Default(0) int labelId,
    @Default('') String displayText,
    @Default('') String backgroundColor,
  }) = _Label;

  factory Label.fromJson(Map<String, dynamic> json) => _$LabelFromJson(json);
}

@freezed
abstract class DeliveryTypePricing with _$DeliveryTypePricing {
  const factory DeliveryTypePricing({required double baseRate, required double perKmRate}) = _DeliveryTypePricing;

  factory DeliveryTypePricing.fromJson(Map<String, dynamic> json) => _$DeliveryTypePricingFromJson(json);
}

@freezed
abstract class Vehicle with _$Vehicle {
  const factory Vehicle({
    required int categoryId,
    required String name,
    required double maxWeightKg,
    required List<WeightTier> weightTiers,
    @Default('') String displayName,
    String? iconUrl,
  }) = _Vehicle;

  const Vehicle._();

  factory Vehicle.fromJson(Map<String, dynamic> json) => _$VehicleFromJson(json);

  String get effectiveDisplayName => displayName.isEmpty ? name : displayName;
}

@freezed
abstract class WeightTier with _$WeightTier {
  const factory WeightTier({
    required int tierId,
    required String name,
    required double minWeightKg,
    required double maxWeightKg,
    required double additionalCharge,
  }) = _WeightTier;

  factory WeightTier.fromJson(Map<String, dynamic> json) => _$WeightTierFromJson(json);
}

@freezed
abstract class PackageType with _$PackageType {
  const factory PackageType({required int packageTypeId, required String name, String? description}) = _PackageType;

  factory PackageType.fromJson(Map<String, dynamic> json) => _$PackageTypeFromJson(json);
}

@freezed
abstract class PaymentMethod with _$PaymentMethod {
  const factory PaymentMethod({
    required int methodId,
    required String name,
    required bool isActive,
    @Default('') String displayName,
    String? description,
  }) = _PaymentMethod;

  const PaymentMethod._();

  factory PaymentMethod.fromJson(Map<String, dynamic> json) => _$PaymentMethodFromJson(json);

  String get effectiveDisplayName => displayName.isEmpty ? name : displayName;
}
