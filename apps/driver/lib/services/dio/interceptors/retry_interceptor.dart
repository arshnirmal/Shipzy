import 'package:dio/dio.dart';

import '../../../utils/logger.dart';

/// Retries failed requests on 5xx responses and network errors.
/// Strategy: max 3 attempts, exponential backoff (500ms → 1s → 2s).
/// 4xx errors (including 401) are NOT retried — handled by AuthInterceptor.
class RetryInterceptor extends Interceptor {
  RetryInterceptor(this._dio);

  final Dio _dio;
  static const _maxAttempts = 3;

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final statusCode = err.response?.statusCode;
    final options = err.requestOptions;
    final attempt = (options.extra['_retryAttempt'] as int?) ?? 0;

    final retriable =
        err.type == DioExceptionType.connectionError ||
        err.type == DioExceptionType.connectionTimeout ||
        err.type == DioExceptionType.receiveTimeout ||
        (statusCode != null && statusCode >= 500);

    if (!retriable || attempt >= _maxAttempts) {
      return handler.next(err);
    }

    final delayMs = 500 * (1 << attempt); // 500, 1000, 2000 ms
    AppLogger.d(
      'Retry ${attempt + 1}/$_maxAttempts after ${delayMs}ms — ${options.method} ${options.path}',
    );
    await Future<void>.delayed(Duration(milliseconds: delayMs));

    options.extra['_retryAttempt'] = attempt + 1;

    try {
      final response = await _dio.request<dynamic>(
        options.path,
        options: Options(
          method: options.method,
          headers: options.headers,
          extra: options.extra,
          contentType: options.contentType,
          responseType: options.responseType,
        ),
        data: options.data,
        queryParameters: options.queryParameters,
      );
      return handler.resolve(response);
    } on DioException catch (retryErr) {
      return onError(retryErr, handler);
    }
  }
}
