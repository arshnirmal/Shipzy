import 'package:freezed_annotation/freezed_annotation.dart';

part 'address_location.freezed.dart';
part 'address_location.g.dart';

@freezed
abstract class Coordinates with _$Coordinates {
  const factory Coordinates({double? latitude, double? longitude}) = _Coordinates;

  factory Coordinates.fromJson(Map<String, dynamic> json) =>
      _$CoordinatesFromJson(json);
}

@freezed
abstract class PlaceContext with _$PlaceContext {
  const factory PlaceContext({String? locality, String? region, String? country}) =
      _PlaceContext;

  factory PlaceContext.fromJson(Map<String, dynamic> json) =>
      _$PlaceContextFromJson(json);
}

@freezed
abstract class PlaceSuggestion with _$PlaceSuggestion {
  const factory PlaceSuggestion({
    required String mapboxId,
    required String name,
    @JsonKey(name: 'fullAddress') required String fullAddress,
    @JsonKey(name: 'placeType') required String placeType,
    Coordinates? coordinates,
    PlaceContext? context,
    @JsonKey(name: 'sessionToken') String? sessionToken,
  }) = _PlaceSuggestion;

  const PlaceSuggestion._();

  factory PlaceSuggestion.fromJson(Map<String, dynamic> json) =>
      _$PlaceSuggestionFromJson(json);

  String get id => mapboxId;
}

@freezed
abstract class PlaceDetails with _$PlaceDetails {
  const factory PlaceDetails({
    required String mapboxId,
    required String name,
    @JsonKey(name: 'fullAddress') required String fullAddress,
    required Coordinates coordinates,
    @JsonKey(name: 'featureType') required String featureType,
    List<double>? bbox,
    PlaceContext? context,
  }) = _PlaceDetails;

  const PlaceDetails._();

  factory PlaceDetails.fromJson(Map<String, dynamic> json) =>
      _$PlaceDetailsFromJson(json);

  String get id => mapboxId;
}

@freezed
abstract class ReverseGeocodeContext with _$ReverseGeocodeContext {
  const factory ReverseGeocodeContext({required String id, required String text}) =
      _ReverseGeocodeContext;

  factory ReverseGeocodeContext.fromJson(Map<String, dynamic> json) =>
      _$ReverseGeocodeContextFromJson(json);
}

@freezed
abstract class ReverseGeocodeResultItem with _$ReverseGeocodeResultItem {
  const factory ReverseGeocodeResultItem({
    required String mapboxId,
    required String name,
    @JsonKey(name: 'fullAddress') required String fullAddress,
    required Coordinates coordinates,
    @JsonKey(name: 'featureType') required String featureType,
    @JsonKey(name: 'placeName') String? placeName,
    Map<String, dynamic>? properties,
    List<ReverseGeocodeContext>? context,
    List<double>? bbox,
    double? relevance,
  }) = _ReverseGeocodeResultItem;

  const ReverseGeocodeResultItem._();

  factory ReverseGeocodeResultItem.fromJson(Map<String, dynamic> json) =>
      _$ReverseGeocodeResultItemFromJson(json);

  String get id => mapboxId;
}

@freezed
abstract class ReverseGeocodeResult with _$ReverseGeocodeResult {
  const factory ReverseGeocodeResult({
    required Coordinates coordinates,
    required List<ReverseGeocodeResultItem> results,
    required int total,
  }) = _ReverseGeocodeResult;

  factory ReverseGeocodeResult.fromJson(Map<String, dynamic> json) =>
      _$ReverseGeocodeResultFromJson(json);
}

@freezed
abstract class RouteGeometry with _$RouteGeometry {
  const factory RouteGeometry({
    required String type,
    @Default(<List<double>>[]) List<List<double>> coordinates,
  }) = _RouteGeometry;

  factory RouteGeometry.fromJson(Map<String, dynamic> json) =>
      _$RouteGeometryFromJson(json);
}

@freezed
abstract class DirectionsResult with _$DirectionsResult {
  const factory DirectionsResult({
    required int distance,
    required int duration,
    required RouteGeometry geometry,
    required String distanceKm,
    required int durationMinutes,
    required Coordinates origin,
    required Coordinates destination,
  }) = _DirectionsResult;

  factory DirectionsResult.fromJson(Map<String, dynamic> json) =>
      _$DirectionsResultFromJson(json);
}

@freezed
abstract class DistanceResult with _$DistanceResult {
  const factory DistanceResult({required double kilometers}) = _DistanceResult;

  const DistanceResult._();

  factory DistanceResult.fromJson(Map<String, dynamic> json) =>
      _$DistanceResultFromJson(json);

  double get distanceKm => kilometers;
}

@freezed
abstract class SearchPlacesRequest with _$SearchPlacesRequest {
  const factory SearchPlacesRequest({
    required String query,
    Coordinates? proximity,
    int? limit,
  }) = _SearchPlacesRequest;

  factory SearchPlacesRequest.fromJson(Map<String, dynamic> json) =>
      _$SearchPlacesRequestFromJson(json);
}

@freezed
abstract class RetrievePlaceRequest with _$RetrievePlaceRequest {
  const factory RetrievePlaceRequest({required String mapboxId, required String sessionToken}) =
      _RetrievePlaceRequest;

  factory RetrievePlaceRequest.fromJson(Map<String, dynamic> json) =>
      _$RetrievePlaceRequestFromJson(json);
}

@freezed
abstract class ReverseGeocodeRequest with _$ReverseGeocodeRequest {
  const factory ReverseGeocodeRequest({required double latitude, required double longitude}) =
      _ReverseGeocodeRequest;

  factory ReverseGeocodeRequest.fromJson(Map<String, dynamic> json) =>
      _$ReverseGeocodeRequestFromJson(json);
}

@freezed
abstract class DirectionsRequest with _$DirectionsRequest {
  const factory DirectionsRequest({required Coordinates origin, required Coordinates destination, String? profile}) =
      _DirectionsRequest;

  factory DirectionsRequest.fromJson(Map<String, dynamic> json) =>
      _$DirectionsRequestFromJson(json);
}

@freezed
abstract class DistanceRequest with _$DistanceRequest {
  const factory DistanceRequest({required double lat1, required double lon1, required double lat2, required double lon2}) =
      _DistanceRequest;

  factory DistanceRequest.fromJson(Map<String, dynamic> json) =>
      _$DistanceRequestFromJson(json);
}
