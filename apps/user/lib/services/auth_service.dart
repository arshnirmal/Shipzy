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

  /// Verify Firebase ID token with backend and create/login user
  Future<Map<String, dynamic>> verifyWithBackend(String idToken, {String? fullName, String? email}) async {
    try {
      final deviceId = await _getDeviceId();
      final data = <String, dynamic>{'idToken': idToken, 'deviceId': deviceId, 'role': 'client'};

      if (fullName != null) data['fullName'] = fullName;
      if (email != null) data['email'] = email;

      final response = await _apiClient.post<Map<String, dynamic>>('/auth/firebase/verify', data: data);

      return response.data!;
    } on DioException catch (e) {
      throw Exception('Failed to verify with backend: ${e.message}');
    }
  }
}
