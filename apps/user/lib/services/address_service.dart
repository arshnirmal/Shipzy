// lib/services/address_service.dart

import 'package:dio/dio.dart';

import '../models/saved_address.dart';
import 'dio/api_client.dart';

class AddressService {
  AddressService(this._apiClient);

  final ApiClient _apiClient;

  /// Get user's saved addresses
  Future<List<SavedAddress>> getAddresses() async {
    try {
      final response = await _apiClient.get<Map<String, dynamic>>('/users/me/addresses');

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to get addresses');
      }

      final data = response.data!['data'] as List<dynamic>;
      return data.map((json) => SavedAddress.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e, 'get addresses');
    }
  }

  /// Save new address
  Future<SavedAddress> saveAddress(CreateAddress addressData) async {
    try {
      final response = await _apiClient.post<Map<String, dynamic>>('/users/me/addresses', data: addressData.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to save address');
      }

      return SavedAddress.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'save address');
    }
  }

  /// Delete saved address
  Future<void> deleteAddress(int addressId) async {
    try {
      final response = await _apiClient.delete<Map<String, dynamic>>('/users/me/addresses/$addressId');

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to delete address');
      }
    } on DioException catch (e) {
      throw _handleDioError(e, 'delete address');
    }
  }

  Exception _handleDioError(DioException e, String operation) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return Exception('Connection timeout during $operation');
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['message'] ?? e.message;
        return Exception('Server error during $operation: $message (Status: $statusCode)');
      case DioExceptionType.cancel:
        return Exception('Request cancelled during $operation');
      case DioExceptionType.connectionError:
        return Exception('Connection error during $operation: ${e.message}');
      case DioExceptionType.badCertificate:
        return Exception('SSL certificate error during $operation');
      case DioExceptionType.unknown:
        return Exception('Unknown network error during $operation: ${e.message}');
    }
  }
}
