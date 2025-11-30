import 'package:freezed_annotation/freezed_annotation.dart';

part 'available_order.freezed.dart';
part 'available_order.g.dart';

@freezed
class AvailableOrder with _$AvailableOrder {
  const factory AvailableOrder({
    required String orderId,
    required double distance, // km from driver
    required double fare,
    required String pickupAddress,
    required String deliveryAddress,
    required double deliveryDistance,
    required String vehicleType, // e.g., '2-Wheeler'
    required String packageType, // e.g., 'Documents'
    required int expiresInSeconds,
    required double pickupLatitude,
    required double pickupLongitude,
    required double deliveryLatitude,
    required double deliveryLongitude,
    @Default(false) bool isUrgent,
  }) = _AvailableOrder;

  factory AvailableOrder.fromJson(Map<String, dynamic> json) => _$AvailableOrderFromJson(json);
}
