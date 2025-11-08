// lib/services/order_service.dart

import 'package:dio/dio.dart';

import '../models/orders/order_response.dart';
import 'dio/api_client.dart';

class OrderService {
  OrderService(this._apiClient);

  final ApiClient _apiClient;

  /// Fetch user's orders with optional filters

  Future<OrdersResponse> fetchOrders({
    int page = 1,
    int limit = 20,
    String? status, // 'active', 'completed', or null for all
  }) async {
    try {
      final queryParams = <String, dynamic>{'page': page, 'limit': limit, if (status != null) 'status': status};

      final response = await _apiClient.get<Map<String, dynamic>>('/orders', queryParameters: queryParams);

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to fetch orders');
      }

      return OrdersResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Fetch orders');
    }
  }

  /// Get order details by ID

  Future<OrderDetailResponse> getOrderDetails(int orderId) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/orders/$orderId');

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to fetch order details');
      }

      return OrderDetailResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Get order details');
    }
  }

  /// Cancel an order

  Future<void> cancelOrder(int orderId, String reason) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/orders/$orderId/cancel', data: {'reason': reason});

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to cancel order');
      }
    } on DioException catch (e) {
      throw _handleDioError(e, 'Cancel order');
    }
  }

  Exception _handleDioError(DioException e, String operation) {
    if (e.response != null) {
      final data = e.response!.data;

      final message = data is Map<String, dynamic> ? data['message'] ?? data['error'] : 'Unknown error';

      return Exception('$operation failed: $message');
    } else if (e.type == DioExceptionType.connectionTimeout) {
      return Exception('$operation failed: Connection timeout');
    } else if (e.type == DioExceptionType.receiveTimeout) {
      return Exception('$operation failed: Server not responding');
    } else if (e.type == DioExceptionType.connectionError) {
      return Exception('$operation failed: No internet connection');
    } else {
      return Exception('$operation failed: ${e.message}');
    }
  }
}
