// lib/models/orders/calculate_fare.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'calculate_fare.freezed.dart';
part 'calculate_fare.g.dart';

/// Coordinate model for latitude and longitude
@freezed
abstract class Coordinate with _$Coordinate {
  const factory Coordinate({required double latitude, required double longitude}) = _Coordinate;

  factory Coordinate.fromJson(Map<String, dynamic> json) => _$CoordinateFromJson(json);
}

///Request for calculate fare endpoint
@freezed
abstract class CalculateFareRequest with _$CalculateFareRequest {
  const factory CalculateFareRequest({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required int weightTierId,
    required Coordinate pickup,
    required Coordinate drop,
  }) = _CalculateFareRequest;

  factory CalculateFareRequest.fromJson(Map<String, dynamic> json) => _$CalculateFareRequestFromJson(json);
}

/// Response for calculate fare endpoint
@freezed
abstract class CalculateFareResponse with _$CalculateFareResponse {
  const factory CalculateFareResponse({required bool success, required String message, required FareData data, required DateTime timestamp}) =
      _CalculateFareResponse;

  factory CalculateFareResponse.fromJson(Map<String, dynamic> json) => _$CalculateFareResponseFromJson(json);
}

/// Fare calculation data
@freezed
abstract class FareData with _$FareData {
  const factory FareData({
    @JsonKey(name: 'basePrice') required double basePrice,
    @JsonKey(name: 'distanceKm') required double distanceKm,
    @JsonKey(name: 'distancePrice') required double distancePrice,
    @JsonKey(name: 'weightSurcharge') required double weightSurcharge,
    @JsonKey(name: 'platformFee') required double platformFee,
    @JsonKey(name: 'specialHandlingFee') required double specialHandlingFee,
    @JsonKey(name: 'subtotalBeforeTax') required double subtotalBeforeTax,
    @JsonKey(name: 'gstAmount') required double gstAmount,
    @JsonKey(name: 'totalPrice') required double totalPrice,
    required String currency,
    @JsonKey(name: 'estimatedDurationMins') int? estimatedDurationMins,
  }) = _FareData;

  factory FareData.fromJson(Map<String, dynamic> json) => _$FareDataFromJson(json);
}
