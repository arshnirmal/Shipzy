// lib/services/auth_service.dart

import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';

import 'dio/api_client.dart';

class AuthService {
  AuthService(this._apiClient);

  final ApiClient _apiClient;

  Future<String> _getDeviceId() async {
    try {
      final deviceInfo = DeviceInfoPlugin();
      final androidInfo = await deviceInfo.androidInfo;
      return androidInfo.id;
    } catch (e) {
      // Fallback to a generated ID if device info fails
      return 'unknown-device-${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  /// Google OAuth authentication
  Future<Map<String, dynamic>> verifyGoogleToken(String idToken, {String role = 'client'}) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/google/verify',
        data: {'idToken': idToken, 'role': role},
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Google authentication failed');
      }

      return response.data!;
    } on DioException catch (e) {
      throw _handleDioError(e, 'Google authentication');
    }
  }

  /// User registration with email and password
  Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String password,
    required String phoneNumber,
    String role = 'client',
  }) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/register',
        data: {'fullName': fullName, 'email': email, 'password': password, 'role': role, 'phoneNumber': phoneNumber},
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Registration failed');
      }

      return response.data!;
    } on DioException catch (e) {
      throw _handleDioError(e, 'Registration');
    }
  }

  /// User login with email and password
  Future<Map<String, dynamic>> login({required String email, required String password}) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Login failed');
      }

      return response.data!;
    } on DioException catch (e) {
      throw _handleDioError(e, 'Login');
    }
  }

  /// Refresh access token
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/auth/refresh', data: {'refreshToken': refreshToken});

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Token refresh failed');
      }

      return response.data!;
    } on DioException catch (e) {
      throw _handleDioError(e, 'Token refresh');
    }
  }

  /// Logout user
  Future<Map<String, dynamic>> logout(String accessToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/logout',
        options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Logout failed');
      }

      return response.data!;
    } on DioException catch (e) {
      throw _handleDioError(e, 'Logout');
    }
  }

  /// Handle Dio errors with better messages
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
