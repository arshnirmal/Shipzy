import 'package:freezed_annotation/freezed_annotation.dart';

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

  factory OrdersListResponse.fromJson(Map<String, dynamic> json) => _$OrdersListResponseFromJson(json);
}

@freezed
abstract class OrdersPagination with _$OrdersPagination {
  const factory OrdersPagination({@Default(1) int page, @Default(20) int limit, @Default(0) int total, @Default(0) int totalPages}) =
      _OrdersPagination;

  factory OrdersPagination.fromJson(Map<String, dynamic> json) => _$OrdersPaginationFromJson(json);
}

@freezed
abstract class OrderListItem with _$OrderListItem {
  const factory OrderListItem({
    required int orderId,
    required String orderUuid,
    required String orderNumber,
    @JsonKey(fromJson: _statusFromJson, toJson: _statusToJson) required OrderStatus status,
    required double totalPrice,
    required DateTime createdAt,
    required OrderListLocation pickup,
    required OrderListLocation delivery,
    int? statusId,
    int? deliveryTypeId,
    String? deliveryTypeDisplay,
    int? vehicleCategoryId,
    String? vehicleCategoryDisplay,
    String? packageDescription,
    int? weightTierId,
    String? weightTierDisplay,
    double? estimatedDistanceKm,
    double? actualDistanceKm,
    int? actualDurationMins,
    OrderListCourier? courier,
  }) = _OrderListItem;

  const OrderListItem._();

  factory OrderListItem.fromJson(Map<String, dynamic> json) => _$OrderListItemFromJson(json);

  double? get distance => actualDistanceKm ?? estimatedDistanceKm;
}

@freezed
abstract class OrderListLocation with _$OrderListLocation {
  const factory OrderListLocation({@Default('Unknown') String address}) = _OrderListLocation;

  factory OrderListLocation.fromJson(Map<String, dynamic> json) => _$OrderListLocationFromJson(json);
}

@freezed
abstract class OrderListCourier with _$OrderListCourier {
  const factory OrderListCourier({String? name, String? photo}) = _OrderListCourier;

  factory OrderListCourier.fromJson(Map<String, dynamic> json) => _$OrderListCourierFromJson(json);
}

OrderStatus _statusFromJson(String? rawStatus) => OrderStatusX.fromApi(rawStatus ?? 'pending');

String _statusToJson(OrderStatus status) {
  switch (status) {
    case OrderStatus.pending:
      return 'pending';
    case OrderStatus.accepted:
      return 'accepted';
    case OrderStatus.pickedUp:
      return 'picked_up';
    case OrderStatus.inTransit:
      return 'in_transit';
    case OrderStatus.delivered:
      return 'delivered';
    case OrderStatus.cancelled:
      return 'cancelled';
    case OrderStatus.undeliverable:
      return 'undeliverable';
    case OrderStatus.returned:
      return 'returned';
    case OrderStatus.rejected:
      return 'rejected';
  }
}
