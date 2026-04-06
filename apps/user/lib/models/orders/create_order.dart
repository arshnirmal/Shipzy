import 'package:freezed_annotation/freezed_annotation.dart';

import 'fare_breakdown.dart';
import 'order.dart';

part 'create_order.freezed.dart';
part 'create_order.g.dart';

@freezed
abstract class CreateOrderFulfillment with _$CreateOrderFulfillment {
  const factory CreateOrderFulfillment({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required int weightTierId,
    required int paymentMethodId,
    int? packageTypeId,
  }) = _CreateOrderFulfillment;

  factory CreateOrderFulfillment.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderFulfillmentFromJson(json);
}

@freezed
abstract class CreateOrderContactLocation with _$CreateOrderContactLocation {
  const factory CreateOrderContactLocation({
    required String fullAddress,
    required double latitude,
    required double longitude,
    required String city,
    required String state,
    required String postalCode,
    required String contactName,
    required String contactPhone,
    int? addressId,
    String? howToReach,
    String? building,
    String? floor,
    String? flatNumber,
    String? landmark,
  }) = _CreateOrderContactLocation;

  factory CreateOrderContactLocation.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderContactLocationFromJson(json);
}

@freezed
abstract class CreateOrderLocations with _$CreateOrderLocations {
  const factory CreateOrderLocations({
    required CreateOrderContactLocation pickup,
    required CreateOrderContactLocation delivery,
  }) = _CreateOrderLocations;

  factory CreateOrderLocations.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderLocationsFromJson(json);
}

@freezed
abstract class CreateOrderPackage with _$CreateOrderPackage {
  const factory CreateOrderPackage({
    String? description,
    String? specialInstructions,
    double? declaredValue,
    @Default(false) bool notifyRecipientSms,
  }) = _CreateOrderPackage;

  factory CreateOrderPackage.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderPackageFromJson(json);
}

@freezed
abstract class CreateOrderSchedule with _$CreateOrderSchedule {
  const factory CreateOrderSchedule({DateTime? pickupAt, DateTime? deliveryAt}) =
      _CreateOrderSchedule;

  factory CreateOrderSchedule.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderScheduleFromJson(json);
}

@freezed
abstract class CreateOrderRequest with _$CreateOrderRequest {
  const factory CreateOrderRequest({
    required CreateOrderFulfillment fulfillment,
    required CreateOrderLocations locations,
    required CreateOrderPackage package,
    required FareBreakdown pricing,
    CreateOrderSchedule? schedule,
    String? couponCode,
  }) = _CreateOrderRequest;

  factory CreateOrderRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderRequestFromJson(json);
}

@freezed
abstract class CreateOrderResponse with _$CreateOrderResponse {
  const factory CreateOrderResponse({
    required bool success,
    required String message,
    required CreateOrderResponseData data,
    required String timestamp,
  }) = _CreateOrderResponse;

  factory CreateOrderResponse.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderResponseFromJson(json);
}

@freezed
abstract class CreateOrderResponseData with _$CreateOrderResponseData {
  const factory CreateOrderResponseData({required Order order}) =
      _CreateOrderResponseData;

  factory CreateOrderResponseData.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderResponseDataFromJson(json);
}
