import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/auth_state_provider.dart';
import '../../../providers/storage_provider.dart';
import '../dio_provider.dart';

class AuthInterceptor extends Interceptor {
  AuthInterceptor(this.ref);
  final Ref ref;

  @override
  Future<void> onRequest(RequestOptions options, RequestInterceptorHandler handler) async {
    // Get access token
    final tokenStorage = ref.read(tokenStorageProvider);
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
        final authState = ref.read(authStateProvider.notifier);
        final refreshSuccess = await authState.refreshAccessToken();

        if (refreshSuccess) {
          // Retry the original request with new token
          final tokenStorage = ref.read(tokenStorageProvider);
          final newAccessToken = await tokenStorage.getAccessToken();

          if (newAccessToken != null) {
            final newOptions = err.requestOptions.copyWith(
              headers: {
                ...err.requestOptions.headers,
                'Authorization': 'Bearer $newAccessToken',
              },
            );

            try {
              final dioClient = ref.read(dioProvider);
              final response = await dioClient.request(
                newOptions.path,
                options: Options(
                  method: newOptions.method,
                  headers: newOptions.headers,
                ),
                data: newOptions.data,
                queryParameters: newOptions.queryParameters,
              );

              return handler.resolve(response);
            } catch (retryError) {
              return handler.next(err);
            }
          }
        }
      } catch (e) {
        // Refresh failed, logout user
        final authState = ref.read(authStateProvider.notifier);
        await authState.logout();
      }
    }

    return handler.next(err);
  }
}
