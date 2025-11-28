// lib/models/orders/order.dart

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
    int? packageTypeId,
    int? weightTierId,
    String? weightTierDisplay,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    int? actualDurationMins,
    DateTime? statusTimestamp,
    DateTime? acceptedAt,
    DateTime? pickedUpAt,
    DateTime? deliveredAt,
    DateTime? cancelledAt,
    OrderPayment? payment,
    OrderClient? client,
    String? specialInstructions,
    String? cancellationReason,
    OrderCourier? courier,
  }) = _Order;

  const Order._();

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);

  // Convenience getters for UI compatibility
  String get pickupAddress => pickup.address;
  String get deliveryAddress => delivery.address;
  String get pickupContact => pickup.contactName ?? '';
  String get deliveryContact => delivery.contactName ?? '';
  String get packageType => packageDescription ?? 'Package';
  double get totalFare => totalPrice;
  double? get distance => actualDistanceKm ?? estimatedDistanceKm;
  String? get packageWeight => weightTierDisplay;
  double? get baseFare => payment?.fareBreakdown?.basePrice;
  double? get distanceCharge => payment?.fareBreakdown?.distancePrice;
  double? get platformFee => payment?.fareBreakdown?.weightSurcharge;
  String? get paymentMethod => payment?.paymentMethod;
}

@freezed
abstract class OrderLocation with _$OrderLocation {
  const factory OrderLocation({
    required int locationId,
    required String address,
    String? building,
    String? floor,
    String? flat,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    double? latitude,
    double? longitude,
    String? contactName,
    String? contactPhone,
  }) = _OrderLocation;

  factory OrderLocation.fromJson(Map<String, dynamic> json) => _$OrderLocationFromJson(json);
}

@freezed
abstract class OrderPayment with _$OrderPayment {
  const factory OrderPayment({String? paymentMethod, FareBreakdown? fareBreakdown}) = _OrderPayment;

  factory OrderPayment.fromJson(Map<String, dynamic> json) => _$OrderPaymentFromJson(json);
}

@freezed
abstract class FareBreakdown with _$FareBreakdown {
  const factory FareBreakdown({double? basePrice, double? distancePrice, double? weightSurcharge, double? totalPrice}) = _FareBreakdown;

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => _$FareBreakdownFromJson(json);
}

@freezed
abstract class OrderClient with _$OrderClient {
  const factory OrderClient({required String name, required String phone}) = _OrderClient;

  factory OrderClient.fromJson(Map<String, dynamic> json) => _$OrderClientFromJson(json);
}

@freezed
abstract class OrderCourier with _$OrderCourier {
  const factory OrderCourier({
    required int id,
    required String name,
    required String phone,
    String? photo,
    String? assignmentStatus,
    DateTime? assignedAt,
    DateTime? acceptedAt,
  }) = _OrderCourier;

  factory OrderCourier.fromJson(Map<String, dynamic> json) => _$OrderCourierFromJson(json);
}
