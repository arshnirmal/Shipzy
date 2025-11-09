// lib/models/orders/create_order.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'create_order.freezed.dart';
part 'create_order.g.dart';

/// Request for create order endpoint
@freezed
abstract class CreateOrderRequest with _$CreateOrderRequest {
  const factory CreateOrderRequest({
    required String pickupAddress,
    required double pickupLatitude,
    required double pickupLongitude,
    required String pickupContactName,
    required String pickupContactPhone,
    required String deliveryAddress,
    required double deliveryLatitude,
    required double deliveryLongitude,
    required String deliveryContactName,
    required String deliveryContactPhone,
    required String packageType,
    required double packageWeight,
    required String packageDescription,
    required String deliveryType,
    required String paymentMethod,
    double? declaredValue,
    String? specialInstructions,
  }) = _CreateOrderRequest;

  factory CreateOrderRequest.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderRequestFromJson(json);
}

/// Response for create order endpoint
@freezed
abstract class CreateOrderResponse with _$CreateOrderResponse {
  const factory CreateOrderResponse({
    required bool success,
    required String message,
    required CreatedOrderData data,
  }) = _CreateOrderResponse;

  factory CreateOrderResponse.fromJson(Map<String, dynamic> json) =>
      _$CreateOrderResponseFromJson(json);
}

/// Created order data
@freezed
abstract class CreatedOrderData with _$CreatedOrderData {
  const factory CreatedOrderData({
    required int orderId,
    required String orderNumber,
    required String status,
    required String pickupAddress,
    required String deliveryAddress,
    required double totalFare,
    required double estimatedDistance,
    required int estimatedDuration,
    required DateTime createdAt,
  }) = _CreatedOrderData;

  factory CreatedOrderData.fromJson(Map<String, dynamic> json) =>
      _$CreatedOrderDataFromJson(json);
}
