// lib/models/orders/calculate_fare.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import 'fare_breakdown.dart';

part 'calculate_fare.freezed.dart';
part 'calculate_fare.g.dart';

/// Coordinate model for latitude and longitude
@freezed
abstract class OrderCoordinate with _$OrderCoordinate {
  const factory OrderCoordinate({required double latitude, required double longitude}) = _OrderCoordinate;

  factory OrderCoordinate.fromJson(Map<String, dynamic> json) => _$OrderCoordinateFromJson(json);
}

@freezed
abstract class CalculateFareFulfillment with _$CalculateFareFulfillment {
  const factory CalculateFareFulfillment({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required int weightTierId,
    int? packageTypeId,
  }) = _CalculateFareFulfillment;

  factory CalculateFareFulfillment.fromJson(Map<String, dynamic> json) => _$CalculateFareFulfillmentFromJson(json);
}

@freezed
abstract class CalculateFareLocations with _$CalculateFareLocations {
  const factory CalculateFareLocations({required OrderCoordinate pickup, required OrderCoordinate delivery}) = _CalculateFareLocations;

  factory CalculateFareLocations.fromJson(Map<String, dynamic> json) => _$CalculateFareLocationsFromJson(json);
}

/// Request for calculate fare endpoint
@freezed
abstract class CalculateFareRequest with _$CalculateFareRequest {
  const factory CalculateFareRequest({required CalculateFareFulfillment fulfillment, required CalculateFareLocations locations}) =
      _CalculateFareRequest;

  factory CalculateFareRequest.fromJson(Map<String, dynamic> json) => _$CalculateFareRequestFromJson(json);
}

/// Response for calculate fare endpoint
@freezed
abstract class CalculateFareResponse with _$CalculateFareResponse {
  const factory CalculateFareResponse({required bool success, required String message, required FareResponseData data, required String timestamp}) =
      _CalculateFareResponse;

  factory CalculateFareResponse.fromJson(Map<String, dynamic> json) => _$CalculateFareResponseFromJson(json);
}

/// Fare calculation payload
@freezed
abstract class FareResponseData with _$FareResponseData {
  const factory FareResponseData({required FareBreakdown pricing, int? estimatedDurationMins}) = _FareResponseData;

  factory FareResponseData.fromJson(Map<String, dynamic> json) => _$FareResponseDataFromJson(json);
}
