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
    required String deliveryTypeDisplay,
    required int vehicleCategoryId,
    required String vehicleCategoryDisplay,
    required double totalPrice,
    required DateTime createdAt,
    required DateTime updatedAt,
    required OrderLocation pickup,
    required OrderLocation delivery,
    // Client information
    required OrderClient client, // Fare breakdown
    required OrderFareBreakdown fareBreakdown,
    String? packageDescription,
    int? packageTypeId,
    int? weightTierId,
    String? weightTierDisplay,
    String? specialInstructions,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    int? actualDurationMins,
    double? estimatedDurationMins,
    @JsonKey(readValue: _readTimelineConfirmedAt) DateTime? confirmedAt,
    @JsonKey(readValue: _readTimelineAssignedAt) DateTime? assignedAt,
    @JsonKey(readValue: _readTimelinePickedUpAt) DateTime? pickedUpAt,
    @JsonKey(readValue: _readTimelineDeliveredAt) DateTime? deliveredAt,
    @JsonKey(readValue: _readTimelineCancelledAt) DateTime? cancelledAt,
    String? cancellationReason,
    OrderPayment? payment,
    // Courier information (when assigned)
    OrderCourier? courier,
    // Rating information
    OrderRating? rating,
  }) = _Order;

  const Order._();

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);

  static Object? _readTimelineField(Map<dynamic, dynamic> json, String field) {
    final timeline = json['timeline'];
    if (timeline is Map<dynamic, dynamic> && timeline.containsKey(field)) {
      return timeline[field];
    }
    return json[field];
  }

  static Object? _readTimelineConfirmedAt(Map<dynamic, dynamic> json, String _) => _readTimelineField(json, 'confirmedAt');

  static Object? _readTimelineAssignedAt(Map<dynamic, dynamic> json, String _) => _readTimelineField(json, 'assignedAt');

  static Object? _readTimelinePickedUpAt(Map<dynamic, dynamic> json, String _) => _readTimelineField(json, 'pickedUpAt');

  static Object? _readTimelineDeliveredAt(Map<dynamic, dynamic> json, String _) => _readTimelineField(json, 'deliveredAt');

  static Object? _readTimelineCancelledAt(Map<dynamic, dynamic> json, String _) => _readTimelineField(json, 'cancelledAt');

  // Convenience getters for UI compatibility
  String get pickupAddress => pickup.address;
  String get deliveryAddress => delivery.address;
  String get pickupContact => pickup.contactName ?? '';
  String get deliveryContact => delivery.contactName ?? '';
  String get packageType => packageDescription ?? 'Package';
  double get totalFare => totalPrice;
  double? get distance => actualDistanceKm ?? estimatedDistanceKm;
  String? get packageWeight => weightTierDisplay;
  DateTime? get statusTimestamp => cancelledAt ?? deliveredAt ?? pickedUpAt ?? assignedAt ?? confirmedAt ?? createdAt;
  DateTime? get acceptedAt => assignedAt;
}

@freezed
abstract class OrderLocation with _$OrderLocation {
  const factory OrderLocation({
    required String address,
    int? locationId,
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
    String? howToReach,
  }) = _OrderLocation;

  factory OrderLocation.fromJson(Map<String, dynamic> json) => _$OrderLocationFromJson(json);
}

@freezed
abstract class OrderPayment with _$OrderPayment {
  const factory OrderPayment({String? paymentMethod, OrderFareBreakdown? fareBreakdown}) = _OrderPayment;

  factory OrderPayment.fromJson(Map<String, dynamic> json) => _$OrderPaymentFromJson(json);
}

@freezed
abstract class OrderFareBreakdown with _$OrderFareBreakdown {
  const factory OrderFareBreakdown({
    required double basePrice,
    required double distanceKm,
    required double distancePrice,
    required double weightSurcharge,
    required double platformFee,
    required double subtotalBeforeTax,
    required double gstAmount,
    required double totalPrice,
    required String currency,
  }) = _OrderFareBreakdown;

  factory OrderFareBreakdown.fromJson(Map<String, dynamic> json) => _$OrderFareBreakdownFromJson(json);
}

@freezed
abstract class OrderClient with _$OrderClient {
  const factory OrderClient({required int userId, String? name, String? phone, String? profilePictureUrl}) = _OrderClient;

  factory OrderClient.fromJson(Map<String, dynamic> json) => _$OrderClientFromJson(json);
}

@freezed
abstract class OrderCourier with _$OrderCourier {
  const factory OrderCourier({
    required int userId,
    String? name,
    String? phone,
    OrderCourierVehicle? vehicle,
    OrderCourierRating? rating,
    String? profilePictureUrl,
  }) = _OrderCourier;

  factory OrderCourier.fromJson(Map<String, dynamic> json) => _$OrderCourierFromJson(json);
}

@freezed
abstract class OrderCourierVehicle with _$OrderCourierVehicle {
  const factory OrderCourierVehicle({
    required int vehicleId,
    required int categoryId,
    required String category,
    required bool isActive,
    required String vehicleNumber,
    required String model,
    required int year,
  }) = _OrderCourierVehicle;

  factory OrderCourierVehicle.fromJson(Map<String, dynamic> json) => _$OrderCourierVehicleFromJson(json);
}

@freezed
abstract class OrderCourierRating with _$OrderCourierRating {
  const factory OrderCourierRating({required double averageRating, required int totalRatings}) = _OrderCourierRating;

  factory OrderCourierRating.fromJson(Map<String, dynamic> json) => _$OrderCourierRatingFromJson(json);
}

@freezed
abstract class OrderRating with _$OrderRating {
  const factory OrderRating({
    required int ratingId,
    required int orderId,
    required int rating,
    required bool isAnonymous,
    required DateTime createdAt,
    String? comment,
  }) = _OrderRating;

  factory OrderRating.fromJson(Map<String, dynamic> json) => _$OrderRatingFromJson(json);
}
