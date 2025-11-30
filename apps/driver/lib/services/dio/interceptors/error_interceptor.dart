import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../utils/logger.dart';

class ErrorInterceptor extends Interceptor {
  ErrorInterceptor(this.ref);
  final Ref ref;

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    AppLogger.e('API Error: ${err.message}', error: err, stackTrace: err.stackTrace);

    // Handle different error types
    switch (err.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        // Show timeout error to user
        break;
      case DioExceptionType.badResponse:
        // Handle HTTP errors
        break;
      case DioExceptionType.cancel:
        // Request cancelled
        break;
      case DioExceptionType.connectionError:
        // Connection error
        break;
      case DioExceptionType.badCertificate:
        // Certificate error
        break;
      case DioExceptionType.unknown:
        // Unknown error
        break;
    }

    return handler.next(err);
  }
}
