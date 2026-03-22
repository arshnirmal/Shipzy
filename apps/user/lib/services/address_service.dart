// lib/services/address_service.dart

import 'package:dio/dio.dart';

import '../models/address_location.dart';
import '../models/saved_address.dart';
import 'dio/api_client.dart';
import 'dio/api_exception.dart';

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

  /// Search places (step 1 - get suggestions)
  Future<List<PlaceSuggestion>> searchPlaces({required String query, String? proximity, int? limit}) async {
    try {
      final request = SearchPlacesRequest(query: query, proximity: proximity, limit: limit);

      final response = await _apiClient.post<Map<String, dynamic>>('/addresses/search', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to search places');
      }

      final results = response.data!['data'] as List<dynamic>;
      return results.map((json) => PlaceSuggestion.fromJson(json as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      throw _handleDioError(e, 'search places');
    }
  }

  /// Retrieve place details (step 2)
  Future<PlaceDetails> retrievePlaceDetails({required String mapboxId, required String sessionToken}) async {
    try {
      final request = RetrievePlaceRequest(mapboxId: mapboxId, sessionToken: sessionToken);

      final response = await _apiClient.post<Map<String, dynamic>>('/addresses/retrieve', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to retrieve place details');
      }

      return PlaceDetails.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'retrieve place details');
    }
  }

  /// Reverse geocode (coordinates to address)
  Future<ReverseGeocodeResult> reverseGeocode({required double latitude, required double longitude}) async {
    try {
      final request = ReverseGeocodeRequest(latitude: latitude, longitude: longitude);

      final response = await _apiClient.post<Map<String, dynamic>>('/addresses/reverse-geocode', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to reverse geocode');
      }

      return ReverseGeocodeResult.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'reverse geocode');
    }
  }

  /// Get directions between points
  Future<DirectionsResult> getDirections({
    required double originLat,
    required double originLng,
    required double destLat,
    required double destLng,
    String? profile,
  }) async {
    try {
      final request = DirectionsRequest(
        origin: Coordinates(latitude: originLat, longitude: originLng),
        destination: Coordinates(latitude: destLat, longitude: destLng),
        profile: profile ?? 'driving',
      );

      final response = await _apiClient.post<Map<String, dynamic>>('/addresses/directions', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to get directions');
      }

      return DirectionsResult.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'get directions');
    }
  }

  /// Calculate distance between coordinates
  Future<DistanceResult> calculateDistance({required double lat1, required double lon1, required double lat2, required double lon2}) async {
    try {
      final request = DistanceRequest(lat1: lat1, lon1: lon1, lat2: lat2, lon2: lon2);

      final response = await _apiClient.post<Map<String, dynamic>>('/addresses/distance', data: request.toJson());

      if (response.data?['success'] != true) {
        throw Exception(response.data?['message'] ?? 'Failed to calculate distance');
      }

      return DistanceResult.fromJson(response.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      throw _handleDioError(e, 'calculate distance');
    }
  }

  ApiException _handleDioError(DioException e, String operation) =>
      mapDioException(e, operation);
}
