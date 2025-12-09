import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/driver_profile.dart';
import '../providers/dio_provider.dart';

part 'api_service.g.dart';

@riverpod
ApiService apiService(ApiServiceRef ref) => ApiService(ref.read(dioProvider));

class ApiService {
  ApiService(this._dio);
  final Dio _dio;

  Future<void> updateDriverAvailability({required bool isAvailable, required bool isOnline, Map<String, double>? location}) async {
    final data = <String, dynamic>{'isAvailable': isAvailable, 'isOnline': isOnline};
    if (location != null) {
      data['location'] = {'latitude': location['latitude'], 'longitude': location['longitude']};
    }
    await _dio.put('/drivers/me/availability', data: data);
  }

  Future<void> updateDriverLocation({required double latitude, required double longitude}) async {
    await _dio.put('/drivers/me/location', data: {'latitude': latitude, 'longitude': longitude});
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
    final activeAssignment = Map<String, dynamic>.from(data.first as Map);

    // Normalize nullable numeric fields to avoid cast errors
    double numOrZero(dynamic v) => (v as num?)?.toDouble() ?? 0;

    final rawEarnings = Map<String, dynamic>.from(activeAssignment['earningsBreakdown'] as Map? ?? {});
    final normalizedEarnings = {
      'basePayout': numOrZero(rawEarnings['basePayout']),
      'distanceEarning': numOrZero(rawEarnings['distanceEarning']),
      'weightCompensation': numOrZero(rawEarnings['weightCompensation']),
      'peakHourBonus': numOrZero(rawEarnings['peakHourBonus']),
      'urgencyBonus': numOrZero(rawEarnings['urgencyBonus']),
      'onTimeBonus': numOrZero(rawEarnings['onTimeBonus']),
      'qualityBonus': numOrZero(rawEarnings['qualityBonus']),
      'platformCommission': numOrZero(rawEarnings['platformCommission']),
      'customerTip': numOrZero(rawEarnings['customerTip']),
      'grossEarning': numOrZero(rawEarnings['grossEarning']),
      'netEarning': numOrZero(rawEarnings['netEarning']),
    };

    final transformed = {
      ...activeAssignment,
      'driverEarnings': numOrZero(activeAssignment['driverEarnings'] ?? normalizedEarnings['netEarning']),
      'earningsBreakdown': normalizedEarnings,
      'estimatedDistanceKm': numOrZero(activeAssignment['estimatedDistanceKm']),
      'actualDistanceKm': (activeAssignment['actualDistanceKm'] as num?)?.toDouble(),
    };

    // Map to ActiveOrder with the normalized structure
    return ActiveOrder.fromJson(transformed);
  }

  Future<void> acceptOrder(int orderId) async {
    // Fastify rejects empty JSON bodies when content-type is application/json,
    // so send a minimal payload.
    await _dio.post('/orders/$orderId/accept', data: const {'accept': true});
  }

  Future<void> rejectOrder(int orderId) async {
    // Backend might not have an explicit reject endpoint if it just means "ignore"
    // But if we want to hide it from the list, we might need local state or a "skip" endpoint
    // For now, assuming we just ignore it locally or call a skip endpoint if it exists
    // await _dio.post('/orders/$orderId/skip');
  }

  Future<void> updateOrderStatus(int orderId, String status) async {
    await _dio.put('/orders/$orderId/status', data: {'status': status});
  }

  Future<void> rateOrder(int orderId, {required int rating, String? comment}) async {
    await _dio.post('/orders/$orderId/rate', data: {'rating': rating, 'comment': comment});
  }

  Future<Map<String, dynamic>> getDriverRatingStats() async {
    final response = await _dio.get('/drivers/me/rating');
    return response.data['data'] as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> getDetailedEarnings(String period) async {
    // For summary/details screen - get full earnings data
    final response = await _dio.get('/drivers/me/earnings', queryParameters: {'period': period});
    return response.data['data'] as Map<String, dynamic>;
  }
}
