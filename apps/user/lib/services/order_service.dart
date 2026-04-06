// lib/services/order_service.dart

import 'package:dio/dio.dart';

import '../models/orders/calculate_fare.dart';
import '../models/orders/create_order.dart';
import '../models/orders/create_order_data.dart';
import '../models/orders/order_list_item.dart';
import '../models/orders/order_response.dart';
import 'dio/api_client.dart';
import 'dio/api_exception.dart';

class OrderService {
  OrderService(this._apiClient);

  final ApiClient _apiClient;

  /// Fetch user's orders with optional filters

  Future<OrdersListResponse> fetchOrders({
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

      return OrdersListResponse.fromJson(response.data!);
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
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/orders/$orderId/cancel',
        data: {
          'cancellation': {'reason': reason},
        },
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to cancel order');
      }
    } on DioException catch (e) {
      throw _handleDioError(e, 'Cancel order');
    }
  }

  /// Get static data for creating orders (delivery types, package types, payment methods)

  Future<CreateOrderDataResponse> getCreateOrderData() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/static/create-order-data');

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to fetch create order data');
      }

      return CreateOrderDataResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Get create order data');
    }
  }

  /// Calculate fare for an order

  Future<CalculateFareResponse> calculateFare(CalculateFareRequest request) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/orders/calculate-fare', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to calculate fare');
      }

      return CalculateFareResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Calculate fare');
    }
  }

  /// Create a new order

  Future<CreateOrderResponse> createOrder(CreateOrderRequest request) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/orders', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to create order');
      }

      return CreateOrderResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Create order');
    }
  }

  ApiException _handleDioError(DioException e, String operation) => mapDioException(e, operation);
}
