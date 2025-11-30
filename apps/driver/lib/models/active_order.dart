import 'package:freezed_annotation/freezed_annotation.dart';

part 'active_order.freezed.dart';
part 'active_order.g.dart';

enum ActiveOrderStatus { accepted, arrivedAtPickup, pickedUp, arrivedAtDelivery, delivered }

@freezed
class ActiveOrder with _$ActiveOrder {
  const factory ActiveOrder({
    required String orderId,
    required String orderNumber,
    required ActiveOrderStatus status,
    required String pickupAddress,
    required String deliveryAddress,
    required String customerName,
    required String customerPhone,
    required double fare,
    required int etaMinutes,
    required double remainingDistance,
    required double pickupLatitude,
    required double pickupLongitude,
    required double deliveryLatitude,
    required double deliveryLongitude,
    String? packageDescription,
  }) = _ActiveOrder;

  factory ActiveOrder.fromJson(Map<String, dynamic> json) => _$ActiveOrderFromJson(json);
}
