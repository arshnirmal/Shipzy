// lib/services/auth_service.dart

import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';

import '../models/auth/auth_response.dart';
import '../models/user.dart';
import 'dio/api_client.dart';
import 'dio/api_exception.dart';

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
        data: {
          'provider': {'idToken': idToken},
          'identity': {'role': role},
        },
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
        data: {
          'identity': {'fullName': fullName, 'role': role, 'phoneNumber': phoneNumber},
          'credentials': {'email': email, 'password': password},
        },
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
        data: {
          'credentials': {'email': email, 'password': password},
        },
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
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {
          'tokens': {'refreshToken': refreshToken},
        },
      );

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

      return AppUser.fromJson(response.data!['data']['profile'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Get current user');
    }
  }

  /// Update user profile
  Future<AppUser> updateProfile({
    String? fullName,
    String? email,
    String? profilePictureUrl,
    String? phoneNumber,
  }) async {
    try {
      final response = await _apiClient.put<Map<String, dynamic>>(
        '/users/me',
        data: {
          'fullName': ?fullName,
          'email': ?email,
          'profilePictureUrl': ?profilePictureUrl,
          'phoneNumber': ?phoneNumber,
        },
      );

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to update profile');
      }

      return AppUser.fromJson(response.data!['data']['profile'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'Update profile');
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
  ApiException _handleDioError(DioException e, String operation) => mapDioException(e, operation);
}
