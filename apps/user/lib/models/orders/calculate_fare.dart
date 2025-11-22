// lib/models/orders/calculate_fare.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'calculate_fare.freezed.dart';
part 'calculate_fare.g.dart';

///Request for calculate fare endpoint
@freezed
abstract class CalculateFareRequest with _$CalculateFareRequest {
  const factory CalculateFareRequest({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required int weightTierId,
    required double pickupLat,
    required double pickupLng,
    required double dropLat,
    required double dropLng,
  }) = _CalculateFareRequest;

  factory CalculateFareRequest.fromJson(Map<String, dynamic> json) => _$CalculateFareRequestFromJson(json);
}

/// Response for calculate fare endpoint
@freezed
abstract class CalculateFareResponse with _$CalculateFareResponse {
  const factory CalculateFareResponse({required bool success, required String message, required FareData data}) = _CalculateFareResponse;

  factory CalculateFareResponse.fromJson(Map<String, dynamic> json) => _$CalculateFareResponseFromJson(json);
}

/// Fare calculation data
@freezed
abstract class FareData with _$FareData {
  const factory FareData({
    @JsonKey(name: 'base_price') required double basePrice,
    @JsonKey(name: 'distance_km') required double distanceKm,
    @JsonKey(name: 'distance_price') required double distancePrice,
    @JsonKey(name: 'weight_tier_id') required int weightTierId,
    @JsonKey(name: 'weight_tier_name') required String weightTierName,
    @JsonKey(name: 'weight_range_kg') required WeightRange weightRangeKg,
    @JsonKey(name: 'weight_surcharge') required double weightSurcharge,
    @JsonKey(name: 'total_price') required double totalPrice,
    required String currency,
  }) = _FareData;

  factory FareData.fromJson(Map<String, dynamic> json) => _$FareDataFromJson(json);
}

/// Weight range from API
@freezed
abstract class WeightRange with _$WeightRange {
  const factory WeightRange({required double min, required double max}) = _WeightRange;

  factory WeightRange.fromJson(Map<String, dynamic> json) => _$WeightRangeFromJson(json);
}
