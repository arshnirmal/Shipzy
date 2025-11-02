import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../services/dio/interceptors/auth_interceptor.dart';
import '../services/dio/interceptors/error_interceptor.dart';

part 'dio_provider.g.dart';

@Riverpod(keepAlive: true)
Dio dio(Ref ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: dotenv.env['API_BASE_URL'] ?? 'http://localhost:3000/api/v1',
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
    ),
  );

  // Add interceptors
  dio.interceptors.addAll([
    AuthInterceptor(ref),
    ErrorInterceptor(ref),
    PrettyDioLogger(requestHeader: true, requestBody: true, responseHeader: true),
  ]);

  return dio;
}
