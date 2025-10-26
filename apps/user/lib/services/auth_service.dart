import 'package:dio/dio.dart';

import 'dio/api_client.dart';

class AuthService {
  AuthService(this._apiClient);
  final ApiClient _apiClient;

  Future<String> sendOtp(String phoneNumber) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/firebase/verify',
        data: {'phoneNumber': phoneNumber, 'deviceId': 'mobile-device-${DateTime.now().millisecondsSinceEpoch}'},
      );

      return response.data?['verificationId'] as String;
    } on DioException catch (e) {
      throw Exception('Failed to send OTP: ${e.message}');
    }
  }

  Future<Map<String, dynamic>> verifyOtp(String verificationId, String otp) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/firebase/verify',
        data: {'idToken': verificationId, 'otp': otp, 'deviceId': 'mobile-device-${DateTime.now().millisecondsSinceEpoch}'},
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Failed to verify OTP: ${e.message}');
    }
  }
}
