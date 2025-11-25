// lib/models/order.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import 'order_status.dart';

part 'order.freezed.dart';
part 'order.g.dart';

@freezed
abstract class Order with _$Order {
  const factory Order({
    required int orderId,
    required String orderUuid,
    required String orderNumber,
    required OrderStatus status,
    required int statusId,
    required int deliveryTypeId,
    required int vehicleCategoryId,
    required double totalPrice,
    required DateTime createdAt,
    required OrderLocation pickup,
    required OrderLocation delivery,
    String? deliveryTypeDisplay,
    String? vehicleCategoryDisplay,
    String? packageDescription,
    int? weightTierId,
    String? weightTierDisplay,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    int? actualDurationMins,
    DateTime? statusTimestamp,
    OrderCourier? courier,
  }) = _Order;

  const Order._();

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);

  // Convenience getters for UI compatibility
  String get pickupAddress => pickup.address;
  String get deliveryAddress => delivery.address;
  String get packageType => packageDescription ?? 'Package';
  double get totalFare => totalPrice;
}

@freezed
abstract class OrderLocation with _$OrderLocation {
  const factory OrderLocation({required String address}) = _OrderLocation;

  factory OrderLocation.fromJson(Map<String, dynamic> json) => _$OrderLocationFromJson(json);
}

@freezed
abstract class OrderCourier with _$OrderCourier {
  const factory OrderCourier({required String name, String? photo}) = _OrderCourier;

  factory OrderCourier.fromJson(Map<String, dynamic> json) => _$OrderCourierFromJson(json);
}
