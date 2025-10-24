import 'package:dio/dio.dart';

import '../../../../core/network/api_client.dart';

abstract class AuthRemoteDataSource {
  Future<String> sendOtp(String phoneNumber);
  Future<Map<String, dynamic>> verifyOtp(String verificationId, String otp);
}

class AuthRemoteDataSourceImpl implements AuthRemoteDataSource {
  AuthRemoteDataSourceImpl(this._apiClient);
  final ApiClient _apiClient;

  @override
  Future<String> sendOtp(String phoneNumber) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/firebase/verify',
        data: {
          'phoneNumber': phoneNumber,
          'deviceId': 'mobile-device-${DateTime.now().millisecondsSinceEpoch}',
        },
      );

      return response.data?['verificationId'] as String;
    } on DioException catch (e) {
      throw Exception('Failed to send OTP: ${e.message}');
    }
  }

  @override
  Future<Map<String, dynamic>> verifyOtp(String verificationId, String otp) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>(
        '/auth/firebase/verify',
        data: {
          'idToken': verificationId,
          'otp': otp,
          'deviceId': 'mobile-device-${DateTime.now().millisecondsSinceEpoch}',
        },
      );

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Failed to verify OTP: ${e.message}');
    }
  }
}
