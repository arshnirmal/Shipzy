import 'package:freezed_annotation/freezed_annotation.dart';

import 'order_types.dart';

part 'available_order.freezed.dart';
part 'available_order.g.dart';

/// Mirrors API AvailableOrderItem — top-level item from GET /orders/available
@freezed
class AvailableOrderItem with _$AvailableOrderItem {
  const factory AvailableOrderItem({
    required AvailableOrder order,
    required double distanceFromDriverKm,
  }) = _AvailableOrderItem;

  factory AvailableOrderItem.fromJson(Map<String, dynamic> json) =>
      _$AvailableOrderItemFromJson(json);
}

/// Mirrors API BaseOrder — the inner order in an available order item
@freezed
class AvailableOrder with _$AvailableOrder {
  const factory AvailableOrder({
    required OrderIdentifiers identifiers,
    required String status,
    required OrderFulfillment fulfillment,
    required OrderLocations locations,
    required OrderPackage package,
    required FareBreakdown pricing,
    required OrderMetrics metrics,
    required OrderTimeline timeline,
    OrderSchedule? schedule,
    String? couponCode,
  }) = _AvailableOrder;

  factory AvailableOrder.fromJson(Map<String, dynamic> json) =>
      _$AvailableOrderFromJson(json);
}
