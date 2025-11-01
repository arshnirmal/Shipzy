import 'package:device_info_plus/device_info_plus.dart';
import 'package:dio/dio.dart';

import 'dio/api_client.dart';

class AuthService {
  AuthService(this._apiClient);
  final ApiClient _apiClient;

  Future<String> _getDeviceId() async {
    final deviceInfo = DeviceInfoPlugin();
    final androidInfo = await deviceInfo.androidInfo;
    return androidInfo.id;
  }

  /// Google OAuth authentication
  Future<Map<String, dynamic>> verifyGoogleToken(String idToken, {String role = 'client'}) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/google/verify',
        data: {
          'idToken': idToken,
          'role': role,
        },
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Google authentication failed: ${e.message}');
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
        data: {
          'fullName': fullName,
          'email': email,
          'password': password,
          'role': role,
          'phoneNumber': phoneNumber,
        },
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Registration failed: ${e.message}');
    }
  }

  /// User login with email and password
  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final deviceId = await _getDeviceId();
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
        options: Options(headers: {'X-Device-Id': deviceId}),
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Login failed: ${e.message}');
    }
  }

  /// Refresh access token
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Token refresh failed: ${e.message}');
    }
  }

  /// Logout user
  Future<Map<String, dynamic>> logout(String accessToken) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/logout',
        options: Options(headers: {'Authorization': 'Bearer $accessToken'}),
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Logout failed: ${e.message}');
    }
  }

  /// Legacy Firebase verification method (kept for backward compatibility)
  @deprecated
  Future<Map<String, dynamic>> verifyWithBackend(String idToken, {String? fullName, String? email}) async {
    return verifyGoogleToken(idToken);
  }
}
