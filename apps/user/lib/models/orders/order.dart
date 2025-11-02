// lib/models/order.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'order.freezed.dart';
part 'order.g.dart';

@freezed
abstract class Order with _$Order {
  const factory Order({
    required int orderId,
    required String orderNumber,
    required OrderStatus status,
    required String pickupAddress,
    required String deliveryAddress,
    required double pickupLatitude,
    required double pickupLongitude,
    required double deliveryLatitude,
    required double deliveryLongitude,
    required String pickupContactName,
    required String pickupContactPhone,
    required String deliveryContactName,
    required String deliveryContactPhone,
    required String packageType,
    required double packageWeight,
    required double totalFare,
    required double estimatedDistance,
    required int estimatedDuration,
    required DateTime createdAt,
    String? packageDescription,
    String? deliveryType,
    String? specialInstructions,
    int? driverId,
    String? driverName,
    String? driverPhone,
    String? driverVehicle,
    DateTime? acceptedAt,
    DateTime? pickedUpAt,
    DateTime? deliveredAt,
    DateTime? cancelledAt,
    String? cancellationReason,
    DateTime? estimatedDeliveryTime,
  }) = _Order;

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}

/// Order status enum

enum OrderStatus {
  pending,
  accepted,
  @JsonValue('picked_up')
  pickedUp,
  @JsonValue('in_transit')
  inTransit,
  delivered,
  cancelled;

  /// Check if order is active (in progress)
  bool get isActive =>
      this == OrderStatus.pending ||
      this == OrderStatus.accepted ||
      this == OrderStatus.pickedUp ||
      this == OrderStatus.inTransit;

  /// Check if order is completed
  bool get isCompleted =>
      this == OrderStatus.delivered || this == OrderStatus.cancelled;

  /// Get display label
  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.accepted:
        return 'Accepted';
      case OrderStatus.pickedUp:
        return 'Picked Up';
      case OrderStatus.inTransit:
        return 'In Transit';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }
}
