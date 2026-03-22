import 'package:dio/dio.dart';

import '../../models/api_error.dart';

class ApiException implements Exception {
  ApiException({required this.operation, required this.message, this.statusCode, this.errors});

  final String operation;
  final String message;
  final int? statusCode;
  final List<ApiFieldError>? errors;

  @override
  String toString() {
    final statusPart = statusCode != null ? ' (status: $statusCode)' : '';
    return '$operation failed: $message$statusPart';
  }
}

ApiException mapDioException(DioException exception, String operation) {
  final response = exception.response;
  final statusCode = response?.statusCode;

  if (response?.data is Map<String, dynamic>) {
    final data = response!.data as Map<String, dynamic>;
    final parsed = ApiErrorResponse.fromJson({
      'success': data['success'] ?? false,
      'message': data['message'] ?? data['error'] ?? 'Unknown error',
      'errors': data['errors'],
      'timestamp': data['timestamp'],
    });

    return ApiException(operation: operation, message: parsed.message, statusCode: statusCode, errors: parsed.errors);
  }

  if (exception.type == DioExceptionType.connectionTimeout ||
      exception.type == DioExceptionType.sendTimeout ||
      exception.type == DioExceptionType.receiveTimeout) {
    return ApiException(operation: operation, message: 'Connection timeout', statusCode: statusCode);
  }

  if (exception.type == DioExceptionType.connectionError) {
    return ApiException(operation: operation, message: 'No internet connection', statusCode: statusCode);
  }

  return ApiException(operation: operation, message: exception.message ?? 'Unexpected network error', statusCode: statusCode);
}
