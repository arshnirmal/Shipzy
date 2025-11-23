// lib/models/orders/create_order.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_order.freezed.dart';
part 'create_order.g.dart';

/// Pickup location for create order
@freezed
abstract class CreateOrderPickup with _$CreateOrderPickup {
  const factory CreateOrderPickup({
    required String address,
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
  }) = _CreateOrderPickup;

  factory CreateOrderPickup.fromJson(Map<String, dynamic> json) => _$CreateOrderPickupFromJson(json);
}

/// Delivery location for create order
@freezed
abstract class CreateOrderDelivery with _$CreateOrderDelivery {
  const factory CreateOrderDelivery({
    required String address,
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
  }) = _CreateOrderDelivery;

  factory CreateOrderDelivery.fromJson(Map<String, dynamic> json) => _$CreateOrderDeliveryFromJson(json);
}

/// Fare breakdown from calculate-fare API
@freezed
abstract class FareBreakdown with _$FareBreakdown {
  const factory FareBreakdown({
    required double basePrice,
    required double distanceKm,
    required double distancePrice,
    required double weightSurcharge,
    required double totalPrice,
    required String currency,
  }) = _FareBreakdown;

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => _$FareBreakdownFromJson(json);
}

/// Request for create order endpoint
@freezed
abstract class CreateOrderRequest with _$CreateOrderRequest {
  const factory CreateOrderRequest({
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required int weightTierId,
    required int paymentMethodId,
    required CreateOrderPickup pickup,
    required CreateOrderDelivery delivery,
    required FareBreakdown fareBreakdown,
    int? packageTypeId,
    String? packageDescription,
    String? specialInstructions,
    String? scheduledPickupTime,
    String? scheduledDeliveryTime,
    double? declaredValue,
  }) = _CreateOrderRequest;

  factory CreateOrderRequest.fromJson(Map<String, dynamic> json) => _$CreateOrderRequestFromJson(json);
}

/// Response for create order endpoint
@freezed
abstract class CreateOrderResponse with _$CreateOrderResponse {
  const factory CreateOrderResponse({required bool success, required String message, required CreatedOrderData data}) = _CreateOrderResponse;

  factory CreateOrderResponse.fromJson(Map<String, dynamic> json) => _$CreateOrderResponseFromJson(json);
}

/// Created order data
@freezed
abstract class CreatedOrderData with _$CreatedOrderData {
  const factory CreatedOrderData({
    required int orderId,
    required String orderUuid,
    required String orderNumber,
    required String status,
    required double totalPrice,
    required DateTime createdAt,
  }) = _CreatedOrderData;

  factory CreatedOrderData.fromJson(Map<String, dynamic> json) => _$CreatedOrderDataFromJson(json);
}
