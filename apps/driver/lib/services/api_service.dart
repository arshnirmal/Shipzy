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

  Future<void> updateDriverAvailability({
    required bool isAvailable,
    bool? isOnline,
    Map<String, double>? location,
  }) async {
    await _dio.put('/drivers/me/availability', data: {
      'availability': {
        'isAvailable': isAvailable,
        'isOnline': isOnline ?? isAvailable,
      },
      if (location != null)
        'tracking': {
          'currentLocation': {
            'latitude': location['latitude'],
            'longitude': location['longitude'],
          },
        },
    });
  }

  Future<void> updateDriverLocation({required double latitude, required double longitude}) async {
    await _dio.put('/drivers/me/location', data: {
      'location': {
        'current': {'latitude': latitude, 'longitude': longitude},
      },
    });
  }

  Future<DriverProfile> getDriverProfile() async {
    final response = await _dio.get('/drivers/me');
    return DriverProfile.fromJson(response.data['data']['driver'] as Map<String, dynamic>);
  }

  Future<List<AvailableOrderItem>> getAvailableOrders({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) async {
    final response = await _dio.get(
      '/orders/available',
      queryParameters: {'latitude': latitude, 'longitude': longitude, 'radius': radius},
    );
    final rawList = response.data['data'] as List;
    return rawList.map((e) => AvailableOrderItem.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ActiveAssignment?> getActiveOrder() async {
    final response = await _dio.get('/drivers/me/assignments');
    final assignments = (response.data['data']['assignments'] as List?) ?? [];
    if (assignments.isEmpty) {
      return null;
    }
    return ActiveAssignment.fromJson(assignments.first as Map<String, dynamic>);
  }

  Future<void> acceptOrder(int orderId) async {
    await _dio.post('/orders/$orderId/accept');
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    await _dio.put('/orders/$orderId/status', data: {
      'transition': {'status': status},
    });
  }

  Future<DriverRatingStats> getDriverRatingStats() async {
    final response = await _dio.get('/drivers/me/rating');
    return DriverRatingStats.fromJson(response.data['data']['rating'] as Map<String, dynamic>);
  }

  Future<EarningsSummary> getDetailedEarnings(String period) async {
    final response = await _dio.get('/drivers/me/earnings', queryParameters: {'period': period});
    return EarningsSummary.fromJson(response.data['data']['earnings'] as Map<String, dynamic>);
  }
}
