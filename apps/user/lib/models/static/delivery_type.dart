// lib/models/static/delivery_type.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'delivery_type.freezed.dart';
part 'delivery_type.g.dart';

@freezed
abstract class DeliveryType with _$DeliveryType {
  const factory DeliveryType({
    @JsonKey(name: 'deliveryTypeId') required int deliveryTypeId,
    @JsonKey(name: 'name') required String name,
    @JsonKey(name: 'displayName') required String displayName,
    @JsonKey(name: 'description') required String description,
    @JsonKey(name: 'pricing') required DeliveryTypePricing pricing,
    @JsonKey(name: 'labels') required List<String> labels,
    @JsonKey(name: 'supportedVehicles') required List<String> supportedVehicles,
    @JsonKey(name: 'sortOrder') required int sortOrder,
    @JsonKey(name: 'isActive') @Default(false) bool isActive,
  }) = _DeliveryType;

  factory DeliveryType.fromJson(Map<String, dynamic> json) =>
      _$DeliveryTypeFromJson(json);
}

@freezed
abstract class DeliveryTypePricing with _$DeliveryTypePricing {
  const factory DeliveryTypePricing({
    @JsonKey(name: 'baseRate') required double baseRate,
    @JsonKey(name: 'perKmRate') required double perKmRate,
  }) = _DeliveryTypePricing;

  factory DeliveryTypePricing.fromJson(Map<String, dynamic> json) =>
      _$DeliveryTypePricingFromJson(json);
}
