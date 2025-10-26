import 'package:dio/dio.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'dio_provider.dart';

part 'api_client.g.dart';

@riverpod
ApiClient apiClient(Ref ref) => ApiClient(ref);

/// API Client wrapper around Dio for making HTTP requests
class ApiClient {
  ApiClient(this._ref);

  final Ref _ref;

  Dio get _dio => _ref.read(dioProvider);

  /// GET request
  Future<Response<T>> get<T>(String path, {Map<String, dynamic>? queryParameters, Options? options}) =>
      _dio.get<T>(path, queryParameters: queryParameters, options: options);

  /// POST request
  Future<Response<T>> post<T>(String path, {Object? data, Map<String, dynamic>? queryParameters, Options? options}) =>
      _dio.post<T>(path, data: data, queryParameters: queryParameters, options: options);

  /// PUT request
  Future<Response<T>> put<T>(String path, {Object? data, Map<String, dynamic>? queryParameters, Options? options}) =>
      _dio.put<T>(path, data: data, queryParameters: queryParameters, options: options);

  /// PATCH request
  Future<Response<T>> patch<T>(String path, {Object? data, Map<String, dynamic>? queryParameters, Options? options}) =>
      _dio.patch<T>(path, data: data, queryParameters: queryParameters, options: options);

  /// DELETE request
  Future<Response<T>> delete<T>(String path, {Map<String, dynamic>? queryParameters, Options? options}) =>
      _dio.delete<T>(path, queryParameters: queryParameters, options: options);
}
