import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/arrive_result.dart';
import '../models/available_order.dart';
import '../models/delivery_attempt.dart';
import '../models/driver_kyc_submission.dart';
import '../models/driver_profile.dart';
import '../models/driver_rating.dart';
import '../models/earnings_summary.dart';
import '../models/location_meta.dart';
import '../models/proof_of_delivery_result.dart';
import '../models/static/static_vehicle_category.dart';
import '../providers/dio_provider.dart';

part 'api_service.g.dart';

@riverpod
ApiService apiService(Ref ref) => ApiService(ref.read(dioProvider));

class RetryAfterException implements Exception {
  const RetryAfterException(this.retryAfter);

  final DateTime retryAfter;

  @override
  String toString() => 'RetryAfterException(retryAfter: $retryAfter)';
}

class ApiService {
  ApiService(this._dio);
  final Dio _dio;

  void _ensureSuccess(Response<dynamic> response, String fallbackMessage) {
    final payload = response.data;
    if (payload is! Map<String, dynamic> || payload['success'] != true) {
      final message = payload is Map<String, dynamic>
          ? payload['message'] as String?
          : null;
      throw Exception(message ?? fallbackMessage);
    }
  }

  Map<String, dynamic> _extractDataMap(
    Response<dynamic> response,
    String fallbackMessage,
  ) {
    _ensureSuccess(response, fallbackMessage);
    final payload = response.data;
    if (payload is! Map<String, dynamic>) {
      throw Exception(fallbackMessage);
    }

    final data = payload['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }

    throw Exception(fallbackMessage);
  }

  Future<void> updateDriverAvailability({
    required bool isAvailable,
    bool? isOnline,
    Map<String, double>? location,
  }) async {
    final response = await _dio.patch(
      '/drivers/me/availability',
      data: {
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
      },
    );
    _ensureSuccess(response, 'Failed to update availability');
  }

  Future<void> updateDriverLocation({
    required double latitude,
    required double longitude,
    LocationMeta? locationMeta,
  }) async {
    final response = await _dio.patch(
      '/drivers/me/location',
      data: {
        'location': {
          'current': {'latitude': latitude, 'longitude': longitude},
        },
        if (locationMeta != null) 'locationMeta': locationMeta.toJson(),
      },
    );
    _ensureSuccess(response, 'Failed to update location');
  }

  Future<DriverProfile> getDriverProfile() async {
    final response = await _dio.get('/drivers/me');
    _ensureSuccess(response, 'Failed to fetch driver profile');
    return DriverProfile.fromJson(
      response.data['data']['driver'] as Map<String, dynamic>,
    );
  }

  /// Active vehicle categories from `GET /static/vehicle-categories` (canonical DB list).
  Future<List<StaticVehicleCategory>> getVehicleCategoryCatalog() async {
    final response = await _dio.get('/static/vehicle-categories');
    final data = _extractDataMap(response, 'Failed to load vehicle categories');
    final rawList = data['vehicleCategories'];
    if (rawList is! List) {
      return [];
    }
    return rawList
        .whereType<Map<String, dynamic>>()
        .map(StaticVehicleCategory.fromJson)
        .toList();
  }

  Future<void> submitVehicleDetails({
    required int vehicleCategoryId,
    required String vehicleMake,
    required String vehicleModel,
    required int vehicleYear,
    required String plateNumber,
    String? profilePictureUrl,
  }) async {
    final response = await _dio.patch(
      '/drivers/me',
      data: {
        if (profilePictureUrl != null && profilePictureUrl.isNotEmpty)
          'profile': {'profilePictureUrl': profilePictureUrl},
        'vehicle': {
          'categoryId': vehicleCategoryId,
          'vehicleNumber': plateNumber,
          'model': '$vehicleMake $vehicleModel'.trim(),
          'year': vehicleYear,
        },
      },
    );
    _ensureSuccess(response, 'Failed to save vehicle details');
  }

  Future<DriverKycSubmissionResult> submitKycDocuments({
    required String licenseUrl,
    required String vehicleRegUrl,
    required String insuranceUrl,
  }) async {
    final response = await _dio.post(
      '/drivers/me/kyc',
      data: {
        'license': {'url': licenseUrl},
        'vehicleReg': {'url': vehicleRegUrl},
        'insurance': {'url': insuranceUrl},
      },
    );
    final data = _extractDataMap(response, 'Failed to submit KYC documents');
    return DriverKycSubmissionResult.fromJson(data);
  }

  Future<List<AvailableOrderItem>> getAvailableOrders({
    required double latitude,
    required double longitude,
    int radius = 10,
  }) async {
    final response = await _dio.get(
      '/orders/available',
      queryParameters: {
        'latitude': latitude,
        'longitude': longitude,
        'radius': radius,
      },
    );
    _ensureSuccess(response, 'Failed to fetch available orders');
    final rawList = response.data['data'] as List;
    return rawList
        .map((e) => AvailableOrderItem.fromJson(e as Map<String, dynamic>))
        .toList();
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

  Future<ArriveResult> arriveAtDelivery(
    int orderId, {
    required double lat,
    required double lng,
  }) async {
    final response = await _dio.post(
      '/orders/$orderId/arrive',
      data: {
        'gps': {'latitude': lat, 'longitude': lng},
      },
    );

    final data = _extractDataMap(
      response,
      'Failed to mark arrival at delivery',
    );
    final payload = data['arrive'];
    if (payload is Map<String, dynamic>) {
      return ArriveResult.fromJson(payload);
    }

    return ArriveResult.fromJson(data);
  }

  Future<void> markUndeliverable(
    int orderId, {
    required String driverNote,
    String? photoUrl,
  }) async {
    try {
      final response = await _dio.post(
        '/orders/$orderId/undeliverable',
        data: {
          'driverNote': driverNote,
          if (photoUrl != null && photoUrl.isNotEmpty) 'photoUrl': photoUrl,
        },
      );
      _ensureSuccess(response, 'Failed to mark order undeliverable');
    } on DioException catch (e) {
      final data = e.response?.data;
      final retryAfterRaw = data is Map<String, dynamic>
          ? data['retryAfter']
          : null;
      if (e.response?.statusCode == 400 && retryAfterRaw is String) {
        final retryAfter = DateTime.tryParse(retryAfterRaw);
        if (retryAfter != null) {
          throw RetryAfterException(retryAfter);
        }
      }
      rethrow;
    }
  }

  Future<void> startReturn(int orderId) async {
    final response = await _dio.post('/orders/$orderId/return');
    _ensureSuccess(response, 'Failed to start return');
  }

  Future<void> confirmReturned(int orderId) async {
    final response = await _dio.post('/orders/$orderId/returned');
    _ensureSuccess(response, 'Failed to confirm returned order');
  }

  Future<ProofOfDeliveryResult> submitProofOfDelivery(
    int orderId, {
    String? recipientName,
    String? photoUrl,
    String? recipientSignatureUrl,
    String? deliveryNotes,
  }) async {
    final response = await _dio.post(
      '/orders/$orderId/proof-of-delivery',
      data: {
        if (recipientName != null && recipientName.isNotEmpty)
          'recipientName': recipientName,
        if (photoUrl != null && photoUrl.isNotEmpty) 'photoUrl': photoUrl,
        if (recipientSignatureUrl != null && recipientSignatureUrl.isNotEmpty)
          'recipientSignatureUrl': recipientSignatureUrl,
        if (deliveryNotes != null && deliveryNotes.isNotEmpty)
          'deliveryNotes': deliveryNotes,
      },
    );

    final data = _extractDataMap(
      response,
      'Failed to submit proof of delivery',
    );
    final proof = data['proof'];
    if (proof is Map<String, dynamic>) {
      return ProofOfDeliveryResult.fromJson(proof);
    }

    return ProofOfDeliveryResult.fromJson(data);
  }

  Future<DeliveryAttempt?> getDeliveryAttempt(int orderId) async {
    final response = await _dio.get('/orders/$orderId/tracking');
    final data = _extractDataMap(response, 'Failed to fetch delivery tracking');
    final attempt = data['attempt'];
    if (attempt == null) {
      return null;
    }

    if (attempt is Map<String, dynamic>) {
      return DeliveryAttempt.fromJson(attempt);
    }

    throw Exception('Invalid delivery attempt payload');
  }

  Future<DriverRatingStats> getDriverRatingStats() async {
    final response = await _dio.get('/drivers/me/rating');
    _ensureSuccess(response, 'Failed to fetch driver rating');
    return DriverRatingStats.fromJson(
      response.data['data']['rating'] as Map<String, dynamic>,
    );
  }

  Future<EarningsSummary> getDetailedEarnings(String period) async {
    final response = await _dio.get(
      '/drivers/me/earnings',
      queryParameters: {'period': period},
    );
    _ensureSuccess(response, 'Failed to fetch earnings');
    return EarningsSummary.fromJson(
      response.data['data']['earnings'] as Map<String, dynamic>,
    );
  }

  Future<void> registerDeviceToken({
    required String deviceToken,
    String deviceType = 'android',
    Map<String, dynamic>? deviceInfo,
  }) async {
    final response = await _dio.post(
      '/users/me/device-token',
      data: {
        'deviceToken': deviceToken,
        'deviceType': deviceType,
        if (deviceInfo != null) 'deviceInfo': deviceInfo,
      },
    );
    _ensureSuccess(response, 'Failed to register device token');
  }

  Future<Map<String, dynamic>> getTripHistory({
    int page = 1,
    int limit = 100,
    String? dateFrom,
    String? dateTo,
  }) async {
    final response = await _dio.get(
      '/drivers/me/trips',
      queryParameters: {
        'page': page,
        'limit': limit,
        if (dateFrom != null) 'dateFrom': dateFrom,
        if (dateTo != null) 'dateTo': dateTo,
      },
    );
    _ensureSuccess(response, 'Failed to fetch trip history');
    return response.data['data'] as Map<String, dynamic>;
  }

  /// Fetch full order details from GET /orders/:id.
  /// Returns data map with 'order' and 'actors' keys.
  Future<Map<String, dynamic>> getOrderById(int orderId) async {
    final response = await _dio.get('/orders/$orderId');
    _ensureSuccess(response, 'Failed to fetch order details');
    return response.data['data'] as Map<String, dynamic>;
  }
}
