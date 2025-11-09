// lib/models/orders/calculate_fare.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'calculate_fare.freezed.dart';
part 'calculate_fare.g.dart';

/// Request for calculate fare endpoint
@freezed
abstract class CalculateFareRequest with _$CalculateFareRequest {
  const factory CalculateFareRequest({
    required double pickupLatitude,
    required double pickupLongitude,
    required double deliveryLatitude,
    required double deliveryLongitude,
    required double packageWeight,
    required String packageType,
    required String deliveryType,
  }) = _CalculateFareRequest;

  factory CalculateFareRequest.fromJson(Map<String, dynamic> json) =>
      _$CalculateFareRequestFromJson(json);
}

/// Response for calculate fare endpoint
@freezed
abstract class CalculateFareResponse with _$CalculateFareResponse {
  const factory CalculateFareResponse({
    required bool success,
    required String message,
    required FareData data,
  }) = _CalculateFareResponse;

  factory CalculateFareResponse.fromJson(Map<String, dynamic> json) =>
      _$CalculateFareResponseFromJson(json);
}

/// Fare calculation data
@freezed
abstract class FareData with _$FareData {
  const factory FareData({
    required double baseFare,
    required double distanceFare,
    required double weightFare,
    required double totalFare,
    required double estimatedDistance,
    required int estimatedDuration,
    required String currency,
  }) = _FareData;

  factory FareData.fromJson(Map<String, dynamic> json) =>
      _$FareDataFromJson(json);
}
