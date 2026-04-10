import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/driver_profile.dart';
import '../models/driver_rating.dart';
import '../models/earnings_summary.dart';
import '../providers/dio_provider.dart';

part 'api_service.g.dart';

@riverpod
ApiService apiService(ApiServiceRef ref) => ApiService(ref.read(dioProvider));

class ApiService {
  ApiService(this._dio);
  final Dio _dio;

  void _ensureSuccess(Response<dynamic> response, String fallbackMessage) {
    final payload = response.data;
    if (payload is! Map<String, dynamic> || payload['success'] != true) {
      final message = payload is Map<String, dynamic> ? payload['message'] as String? : null;
      throw Exception(message ?? fallbackMessage);
    }
  }

  Future<void> updateDriverAvailability({required bool isAvailable, bool? isOnline, Map<String, double>? location}) async {
    final response = await _dio.patch(
      '/drivers/me/availability',
      data: {
        'availability': {'isAvailable': isAvailable, 'isOnline': isOnline ?? isAvailable},
        if (location != null)
          'tracking': {
            'currentLocation': {'latitude': location['latitude'], 'longitude': location['longitude']},
          },
      },
    );
    _ensureSuccess(response, 'Failed to update availability');
  }

  Future<void> updateDriverLocation({required double latitude, required double longitude}) async {
    final response = await _dio.patch(
      '/drivers/me/location',
      data: {
        'location': {
          'current': {'latitude': latitude, 'longitude': longitude},
        },
      },
    );
    _ensureSuccess(response, 'Failed to update location');
  }

  Future<DriverProfile> getDriverProfile() async {
    final response = await _dio.get('/drivers/me');
    _ensureSuccess(response, 'Failed to fetch driver profile');
    return DriverProfile.fromJson(response.data['data']['driver'] as Map<String, dynamic>);
  }

  Future<List<AvailableOrderItem>> getAvailableOrders({required double latitude, required double longitude, int radius = 10}) async {
    final response = await _dio.get('/orders/available', queryParameters: {'latitude': latitude, 'longitude': longitude, 'radius': radius});
    _ensureSuccess(response, 'Failed to fetch available orders');
    final rawList = response.data['data'] as List;
    return rawList.map((e) => AvailableOrderItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ActiveAssignment?> getActiveOrder() async {
    final response = await _dio.get('/drivers/me/assignments');
    _ensureSuccess(response, 'Failed to fetch active assignment');
    final assignments = (response.data['data']['assignments'] as List?) ?? [];
    if (assignments.isEmpty) {
      return null;
    }
    return ActiveAssignment.fromJson(assignments.first as Map<String, dynamic>);
  }

  Future<void> acceptOrder(int orderId) async {
    final response = await _dio.post('/orders/$orderId/accept');
    _ensureSuccess(response, 'Failed to accept order');
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    final response = await _dio.patch(
      '/orders/$orderId/status',
      data: {
        'transition': {'status': status},
      },
    );
    _ensureSuccess(response, 'Failed to update order status');
  }

  Future<DriverRatingStats> getDriverRatingStats() async {
    final response = await _dio.get('/drivers/me/rating');
    _ensureSuccess(response, 'Failed to fetch driver rating');
    return DriverRatingStats.fromJson(response.data['data']['rating'] as Map<String, dynamic>);
  }

  Future<EarningsSummary> getDetailedEarnings(String period) async {
    final response = await _dio.get('/drivers/me/earnings', queryParameters: {'period': period});
    _ensureSuccess(response, 'Failed to fetch earnings');
    return EarningsSummary.fromJson(response.data['data']['earnings'] as Map<String, dynamic>);
  }
}
