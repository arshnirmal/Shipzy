// lib/models/order_response.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import 'order.dart';

part 'order_response.freezed.dart';
part 'order_response.g.dart';

/// List orders response

@freezed
abstract class OrdersResponse with _$OrdersResponse {
  const factory OrdersResponse({
    required bool success,
    required List<Order> data,
    required Pagination pagination,
    required String timestamp,
    String? message,
  }) = _OrdersResponse;

  factory OrdersResponse.fromJson(Map<String, dynamic> json) => _$OrdersResponseFromJson(json);
}

@freezed
abstract class Pagination with _$Pagination {
  const factory Pagination({required int page, required int limit, required int total, required int totalPages}) = _Pagination;

  factory Pagination.fromJson(Map<String, dynamic> json) => _$PaginationFromJson(json);
}

/// Single order response

@freezed
abstract class OrderDetailResponse with _$OrderDetailResponse {
  const factory OrderDetailResponse({required bool success, required String message, required Order data, required String timestamp}) =
      _OrderDetailResponse;

  factory OrderDetailResponse.fromJson(Map<String, dynamic> json) => _$OrderDetailResponseFromJson(json);
}
