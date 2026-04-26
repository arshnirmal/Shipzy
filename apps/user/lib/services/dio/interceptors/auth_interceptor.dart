// lib/services/dio/interceptors/auth_interceptor.dart

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/storage_provider.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this.ref);

  final Ref ref;
  bool _isRefreshing = false;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Skip adding token for auth endpoints
    final authEndpoints = ['/auth/login', '/auth/register', '/auth/google/verify', '/auth/refresh'];

    if (authEndpoints.any((endpoint) => options.path.contains(endpoint))) {
      return handler.next(options);
    }

    // Get access token from secure storage
    final storage = ref.read(secureStorageProvider);
    final accessToken = await storage.read(key: 'access_token');

    if (accessToken != null) {
      options.headers['Authorization'] = 'Bearer $accessToken';
    }

    return handler.next(options);
  }

  @override
  Future<void> onError(DioException err, ErrorInterceptorHandler handler) async {
    // Handle token refresh on 401 Unauthorized
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      // Don't retry auth endpoints
      if (err.requestOptions.path.contains('/auth/')) {
        return handler.next(err);
      }

      try {
        _isRefreshing = true;

        // Get refresh token
        final storage = ref.read(secureStorageProvider);
        final refreshToken = await storage.read(key: 'refresh_token');

        if (refreshToken == null) {
          _isRefreshing = false;
          return handler.next(err);
        }

        // Create a new Dio instance for refresh request (to avoid interceptor loops)
        final dio = Dio(BaseOptions(baseUrl: err.requestOptions.baseUrl, headers: {'Content-Type': 'application/json'}));

        // Call refresh endpoint
        final response = await dio.post<Map<String, dynamic>>(
          '/auth/refresh',
          data: {
            'tokens': {'refreshToken': refreshToken},
          },
        );

        if (response.data?['success'] == true) {
          final newAccessToken = response.data!['data']['auth']['tokens']['accessToken'] as String;
          final newRefreshToken = response.data!['data']['auth']['tokens']['refreshToken'] as String;

          // Store new access token
          await storage.write(key: 'access_token', value: newAccessToken);
          await storage.write(key: 'refresh_token', value: newRefreshToken);

          // Retry the original request with new token
          final retryOptions = err.requestOptions;
          retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';

          _isRefreshing = false;

          // Use the same Dio instance to retry
          final retryDio = Dio(BaseOptions(baseUrl: retryOptions.baseUrl));
          final retryResponse = await retryDio.request<dynamic>(
            retryOptions.path,
            options: Options(method: retryOptions.method, headers: retryOptions.headers),
            data: retryOptions.data,
            queryParameters: retryOptions.queryParameters,
          );

          return handler.resolve(retryResponse);
        } else {
          _isRefreshing = false;
          return handler.next(err);
        }
      } catch (refreshError) {
        _isRefreshing = false;

        // Refresh failed - clear tokens (user needs to login again)
        final storage = ref.read(secureStorageProvider);
        await storage.deleteAll();

        return handler.next(err);
      }
    }

    return handler.next(err);
  }
}
