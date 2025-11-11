// lib/models/address_location.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'address_location.freezed.dart';
part 'address_location.g.dart';

// Coordinates model
@freezed
abstract class Coordinates with _$Coordinates {
  const factory Coordinates({required double latitude, required double longitude}) = _Coordinates;

  factory Coordinates.fromJson(Map<String, dynamic> json) => _$CoordinatesFromJson(json);
}

// Context for places
@freezed
abstract class PlaceContext with _$PlaceContext {
  const factory PlaceContext({String? locality, String? region, String? country}) = _PlaceContext;

  factory PlaceContext.fromJson(Map<String, dynamic> json) => _$PlaceContextFromJson(json);
}

// Place suggestion (search results)
@freezed
abstract class PlaceSuggestion with _$PlaceSuggestion {
  const factory PlaceSuggestion({
    required String id,
    required String name,
    required String fullAddress,
    required String placeType,
    required Coordinates coordinates,
    PlaceContext? context,
    String? sessionToken,
  }) = _PlaceSuggestion;

  factory PlaceSuggestion.fromJson(Map<String, dynamic> json) => _$PlaceSuggestionFromJson(json);
}

// Place details (retrieve results)
@freezed
abstract class PlaceDetails with _$PlaceDetails {
  const factory PlaceDetails({
    required String id,
    required String name,
    required String fullAddress,
    required Coordinates coordinates,
    required String featureType,
    required List<double> bbox,
    PlaceContext? context,
  }) = _PlaceDetails;

  factory PlaceDetails.fromJson(Map<String, dynamic> json) => _$PlaceDetailsFromJson(json);
}

// Reverse geocode context item
@freezed
abstract class ReverseGeocodeContext with _$ReverseGeocodeContext {
  const factory ReverseGeocodeContext({required String id, required String text}) = _ReverseGeocodeContext;

  factory ReverseGeocodeContext.fromJson(Map<String, dynamic> json) => _$ReverseGeocodeContextFromJson(json);
}

// Reverse geocode result item
@freezed
abstract class ReverseGeocodeResultItem with _$ReverseGeocodeResultItem {
  const factory ReverseGeocodeResultItem({
    required String id,
    required String name,
    required String fullAddress,
    required Coordinates coordinates,
    required String featureType,
    String? placeName,
    Map<String, dynamic>? properties,
    List<ReverseGeocodeContext>? context,
    List<double>? bbox,
    double? relevance,
  }) = _ReverseGeocodeResultItem;

  factory ReverseGeocodeResultItem.fromJson(Map<String, dynamic> json) => _$ReverseGeocodeResultItemFromJson(json);
}

// Reverse geocode response
@freezed
abstract class ReverseGeocodeResult with _$ReverseGeocodeResult {
  const factory ReverseGeocodeResult({required Coordinates coordinates, required List<ReverseGeocodeResultItem> results, required int total}) =
      _ReverseGeocodeResult;

  factory ReverseGeocodeResult.fromJson(Map<String, dynamic> json) => _$ReverseGeocodeResultFromJson(json);
}

// Directions result
@freezed
abstract class DirectionsResult with _$DirectionsResult {
  const factory DirectionsResult({
    required int distance, // in meters
    required int duration, // in seconds
    required String geometry,
    required String distanceKm,
    required int durationMinutes,
    required Coordinates origin,
    required Coordinates destination,
  }) = _DirectionsResult;

  factory DirectionsResult.fromJson(Map<String, dynamic> json) => _$DirectionsResultFromJson(json);
}

// Distance result
@freezed
abstract class DistanceResult with _$DistanceResult {
  const factory DistanceResult({required double distanceKm}) = _DistanceResult;

  factory DistanceResult.fromJson(Map<String, dynamic> json) => _$DistanceResultFromJson(json);
}

// Request models

// Search places request
@freezed
abstract class SearchPlacesRequest with _$SearchPlacesRequest {
  const factory SearchPlacesRequest({
    required String query,
    String? proximity, // "longitude,latitude"
    int? limit,
  }) = _SearchPlacesRequest;

  factory SearchPlacesRequest.fromJson(Map<String, dynamic> json) => _$SearchPlacesRequestFromJson(json);
}

// Retrieve place details request
@freezed
abstract class RetrievePlaceRequest with _$RetrievePlaceRequest {
  const factory RetrievePlaceRequest({required String mapboxId, required String sessionToken}) = _RetrievePlaceRequest;

  factory RetrievePlaceRequest.fromJson(Map<String, dynamic> json) => _$RetrievePlaceRequestFromJson(json);
}

// Reverse geocode request
@freezed
abstract class ReverseGeocodeRequest with _$ReverseGeocodeRequest {
  const factory ReverseGeocodeRequest({required double latitude, required double longitude}) = _ReverseGeocodeRequest;

  factory ReverseGeocodeRequest.fromJson(Map<String, dynamic> json) => _$ReverseGeocodeRequestFromJson(json);
}

// Directions request
@freezed
abstract class DirectionsRequest with _$DirectionsRequest {
  const factory DirectionsRequest({required Coordinates origin, required Coordinates destination, String? profile}) = _DirectionsRequest;

  factory DirectionsRequest.fromJson(Map<String, dynamic> json) => _$DirectionsRequestFromJson(json);
}

// Distance request
@freezed
abstract class DistanceRequest with _$DistanceRequest {
  const factory DistanceRequest({required double lat1, required double lon1, required double lat2, required double lon2}) = _DistanceRequest;

  factory DistanceRequest.fromJson(Map<String, dynamic> json) => _$DistanceRequestFromJson(json);
}
