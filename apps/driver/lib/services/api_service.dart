import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/daily_stats.dart';
import '../models/driver_profile.dart';
import '../providers/dio_provider.dart';

part 'api_service.g.dart';

@riverpod
ApiService apiService(ApiServiceRef ref) => ApiService(ref.read(dioProvider));

class ApiService {
  ApiService(this._dio);
  final Dio _dio;

  Future<void> updateDriverAvailability({required bool isAvailable, required bool isOnline}) async {
    await _dio.put('/drivers/me/availability', data: {'isAvailable': isAvailable, 'isOnline': isOnline});
  }

  Future<DailyStats> getDailyStats() async {
    final response = await _dio.get('/drivers/me/earnings');
    final data = response.data['data'];
    return DailyStats(
      earnings: (data['earnings']['today'] as num).toDouble(),
      trips: data['deliveries']['today'] as int,
      weeklyEarnings: (data['earnings']['thisWeek'] as num).toDouble(),
      weeklyTrips: data['deliveries']['thisWeek'] as int,
      totalEarnings: (data['earnings']['total'] as num).toDouble(),
      totalTrips: data['deliveries']['total'] as int,
      averageRating: 4.9, // TODO: Backend doesn't return rating in earnings
    );
  }

  Future<DriverProfile> getDriverProfile() async {
    final response = await _dio.get('/drivers/me');
    return DriverProfile.fromJson(response.data['data']);
  }

  Future<List<AvailableOrder>> getAvailableOrders({required double latitude, required double longitude}) async {
    final response = await _dio.get(
      '/orders/available',
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'radius': 10, // Default radius
      },
    );

    final List data = response.data['data'];
    return data.map((json) {
      // Transform the backend response to match our model
      final transformedJson = <String, dynamic>{
        ...json as Map<String, dynamic>,
        'pickupLatitude': json['pickup']['latitude'],
        'pickupLongitude': json['pickup']['longitude'],
        'deliveryLatitude': json['delivery']['latitude'],
        'deliveryLongitude': json['delivery']['longitude'],
        'distance': json['distanceFromCourierKm'],
        'fare': (json['pricing'] as Map<String, dynamic>)['totalPrice'],
      };
      return AvailableOrder.fromJson(transformedJson);
    }).toList();
  }

  Future<ActiveOrder?> getActiveOrder() async {
    final response = await _dio.get('/drivers/me/assignments');
    final List data = response.data['data'];

    if (data.isEmpty) return null;

    // Get the first active assignment
    final activeAssignment = data.first;

    // Map to ActiveOrder with the new structure
    return ActiveOrder.fromJson(activeAssignment);
  }

  Future<void> acceptOrder(String orderId) async {
    await _dio.post('/orders/$orderId/accept');
  }

  Future<void> rejectOrder(String orderId) async {
    // Backend might not have an explicit reject endpoint if it just means "ignore"
    // But if we want to hide it from the list, we might need local state or a "skip" endpoint
    // For now, assuming we just ignore it locally or call a skip endpoint if it exists
    // await _dio.post('/orders/$orderId/skip');
  }
}
