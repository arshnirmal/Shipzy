import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/storage_provider.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this.ref);
  final Ref ref;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Get access token
    final tokenStorage = ref.read(tokenStorageProvider.notifier);
    final accessToken = await tokenStorage.getAccessToken();

    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle token refresh on 401
    if (err.response?.statusCode == 401) {
      try {
        final tokenStorage = ref.read(tokenStorageProvider.notifier);
        final refreshToken = await tokenStorage.getRefreshToken();

        if (refreshToken != null) {
          // Refresh token logic here
          // Call refresh endpoint
          // Update tokens
          // Retry original request
        }
      } catch (e) {
        // Refresh failed, logout user
        final tokenStorage = ref.read(tokenStorageProvider.notifier);
        await tokenStorage.clearTokens();
      }
    }

    return handler.next(err);
  }
}
