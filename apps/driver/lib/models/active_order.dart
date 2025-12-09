import 'package:freezed_annotation/freezed_annotation.dart';

import 'available_order.dart';
import 'earnings_breakdown.dart';
import 'order_address.dart';

part 'active_order.freezed.dart';
part 'active_order.g.dart';

enum ActiveOrderStatus { accepted, arrivedAtPickup, pickedUp, arrivedAtDelivery, delivered }

@freezed
class ActiveOrder with _$ActiveOrder {
  const factory ActiveOrder({
    required int assignmentId,
    required int orderId,
    required String orderUuid,
    required String orderNumber,
    required String orderStatus,
    required String assignmentStatus,
    required String vehicleCategory,
    required String vehicleCategoryDisplay,
    required String packageType,
    required OrderAddress pickup,
    required OrderAddress delivery,
    String? packageDescription,
    double? estimatedDistanceKm,
    required double driverEarnings,
    required EarningsBreakdown earningsBreakdown,
    required int estimatedDeliveryTime,
    required String assignedAt,
    String? acceptedAt,
    WeightTier? weightTier,
    String? specialInstructions,
    double? declaredValue,
    double? actualDistanceKm,
  }) = _ActiveOrder;

  factory ActiveOrder.fromJson(Map<String, dynamic> json) => _$ActiveOrderFromJson(json);
}
