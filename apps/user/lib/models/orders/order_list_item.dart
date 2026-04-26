import 'package:freezed_annotation/freezed_annotation.dart';

import 'order.dart';
import 'order_status.dart';

part 'order_list_item.freezed.dart';
part 'order_list_item.g.dart';

@freezed
abstract class OrdersListResponse with _$OrdersListResponse {
  const factory OrdersListResponse({
    required bool success,
    @Default(<OrderListItem>[]) List<OrderListItem> data,
    @Default(OrdersPagination()) OrdersPagination pagination,
    @Default('') String timestamp,
  }) = _OrdersListResponse;

  factory OrdersListResponse.fromJson(Map<String, dynamic> json) =>
      _$OrdersListResponseFromJson(json);
}

@freezed
abstract class OrdersPagination with _$OrdersPagination {
  const factory OrdersPagination({
    @Default(1) int page,
    @Default(20) int limit,
    @Default(0) int total,
    @Default(0) int totalPages,
  }) = _OrdersPagination;

  factory OrdersPagination.fromJson(Map<String, dynamic> json) =>
      _$OrdersPaginationFromJson(json);
}

@freezed
abstract class OrderListItem with _$OrderListItem {
  const factory OrderListItem({required Order order, OrderListCourier? courier}) =
      _OrderListItem;

  const OrderListItem._();

  factory OrderListItem.fromJson(Map<String, dynamic> json) =>
      _$OrderListItemFromJson(json);

  int get orderId => order.orderId;
  String get orderUuid => order.orderUuid;
  String get orderNumber => order.orderNumber;
  OrderStatus get status => order.status;
  double get totalPrice => order.totalPrice;
  DateTime get createdAt => order.createdAt;
  OrderLocation get pickup => order.pickup;
  OrderLocation get delivery => order.delivery;
  String? get packageDescription => order.packageDescription;
  String? get deliveryTypeDisplay => order.deliveryTypeDisplay;
  int? get actualDurationMins => order.actualDurationMins;
  double? get distance => order.distance;
}

@freezed
abstract class OrderListCourier with _$OrderListCourier {
  const factory OrderListCourier({
    required int userId,
    String? name,
    String? phone,
    String? profilePictureUrl,
  }) = _OrderListCourier;

  factory OrderListCourier.fromJson(Map<String, dynamic> json) =>
      _$OrderListCourierFromJson(json);
}
