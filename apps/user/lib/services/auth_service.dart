// lib/services/auth_service.dart

import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';

import '../models/auth/auth_response.dart';
import '../models/user.dart';
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
      return 'unknown-device-${DateTime.now().millisecondsSinceEpoch}';
    }
  }

  /// Google OAuth authentication
  Future<GoogleAuthResponse> verifyGoogleToken(String idToken, {String role = 'client'}) async {
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

      return GoogleAuthResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Google authentication');
    }
  }

  /// User registration
  Future<RegisterResponse> register({
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

      return RegisterResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Registration');
    }
  }

  /// User login
  Future<LoginResponse> login({required String email, required String password}) async {
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

      return LoginResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Login');
    }
  }

  /// Refresh access token
  Future<RefreshTokenResponse> refreshToken(String refreshToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/auth/refresh', data: {'refreshToken': refreshToken});

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Token refresh failed');
      }

      return RefreshTokenResponse.fromJson(response.data!);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Token refresh');
    }
  }

  /// Get current user profile
  Future<AppUser> getCurrentUser(String accessToken) async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/users/me', options: Options(headers: {'Authorization': 'Bearer $accessToken'}));

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to get user profile');
      }

      return AppUser.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Get current user');
    }
  }

  /// Logout user
  Future<void> logout(String accessToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/logout',
        options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Logout failed');
      }
    } on DioException catch (e) {
      throw _handleDioError(e, 'Logout');
    }
  }

  /// Handle Dio errors
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
