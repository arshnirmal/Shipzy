import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/daily_stats.dart';

part 'api_service.g.dart';

@riverpod
Dio dio(DioRef ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3000/api/v1', // Using localhost for dev
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
    ),
  );

  dio.interceptors.add(LogInterceptor(requestBody: true, responseBody: true));

  return dio;
}

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
    // Map backend response to DailyStats
    // Note: Backend returns a complex object, we might need to adjust parsing or model
    // For now assuming a compatible structure or mapping manually
    final data = response.data['data'];
    return DailyStats(
      earnings: (data['earnings']['today'] as num).toDouble(),
      trips: data['deliveries']['today'] as int,
      averageRating: 4.9, // Placeholder as backend doesn't return rating in earnings
    );
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
    return data.map((json) => AvailableOrder.fromJson(json)).toList();
  }

  Future<ActiveOrder?> getActiveOrder() async {
    final response = await _dio.get('/drivers/me/assignments');
    final List data = response.data['data'];

    if (data.isEmpty) return null;

    // Get the first active assignment
    // We might need to filter for specific statuses if the backend returns history
    final activeAssignment = data.first;

    // Map to ActiveOrder
    return ActiveOrder(
      orderId: activeAssignment['orderId'].toString(),
      orderNumber: activeAssignment['orderNumber'],
      status: _parseActiveStatus(activeAssignment['assignmentStatus']),
      pickupAddress: activeAssignment['pickup']['address'],
      deliveryAddress: activeAssignment['delivery']['address'],
      customerName: activeAssignment['delivery']['contactName'],
      customerPhone: activeAssignment['delivery']['contactPhone'],
      fare: (activeAssignment['totalPrice'] as num).toDouble(),
      etaMinutes: 15, // Placeholder, need to calculate or get from backend
      remainingDistance: 5, // Placeholder
      pickupLatitude: activeAssignment['pickup']['latitude'],
      pickupLongitude: activeAssignment['pickup']['longitude'],
      deliveryLatitude: activeAssignment['delivery']['latitude'],
      deliveryLongitude: activeAssignment['delivery']['longitude'],
      packageDescription: activeAssignment['packageDescription'],
    );
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

  ActiveOrderStatus _parseActiveStatus(String status) {
    switch (status) {
      case 'accepted':
        return ActiveOrderStatus.accepted;
      case 'arrived_pickup':
        return ActiveOrderStatus.arrivedAtPickup;
      case 'picked_up':
        return ActiveOrderStatus.pickedUp;
      case 'arrived_delivery':
        return ActiveOrderStatus.arrivedAtDelivery;
      case 'delivered':
        return ActiveOrderStatus.delivered;
      default:
        return ActiveOrderStatus.accepted;
    }
  }
}
