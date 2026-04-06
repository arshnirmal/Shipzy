import 'package:freezed_annotation/freezed_annotation.dart';

import 'order.dart';
import 'order_list_item.dart';

part 'order_response.freezed.dart';
part 'order_response.g.dart';

@freezed
abstract class OrdersResponse with _$OrdersResponse {
  const factory OrdersResponse({
    required bool success,
    required List<Order> data,
    required OrdersPagination pagination,
    required String timestamp,
    String? message,
  }) = _OrdersResponse;

  factory OrdersResponse.fromJson(Map<String, dynamic> json) =>
      _$OrdersResponseFromJson(json);
}

@freezed
abstract class OrderDetailResponse with _$OrderDetailResponse {
  const factory OrderDetailResponse({
    required bool success,
    required String message,
    required OrderDetailData data,
    required String timestamp,
  }) = _OrderDetailResponse;

  factory OrderDetailResponse.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailResponseFromJson(json);
}

@freezed
abstract class OrderDetailData with _$OrderDetailData {
  const factory OrderDetailData({required Order order, required OrderActors actors}) =
      _OrderDetailData;

  factory OrderDetailData.fromJson(Map<String, dynamic> json) =>
      _$OrderDetailDataFromJson(json);
}

@freezed
abstract class OrderActors with _$OrderActors {
  const factory OrderActors({required OrderClient client, OrderCourier? courier}) =
      _OrderActors;

  factory OrderActors.fromJson(Map<String, dynamic> json) =>
      _$OrderActorsFromJson(json);
}
