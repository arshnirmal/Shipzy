// lib/models/address/place_suggestion.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'place_suggestion.freezed.dart';
part 'place_suggestion.g.dart';

@freezed
abstract class PlaceSuggestion with _$PlaceSuggestion {
  const factory PlaceSuggestion({
    @JsonKey(name: 'placeName') required String placeName,
    @JsonKey(name: 'address') required String address,
    @JsonKey(name: 'latitude') required double latitude,
    @JsonKey(name: 'longitude') required double longitude,
    @JsonKey(name: 'confidence') required double confidence,
    @JsonKey(name: 'mapboxId') String? mapboxId,
  }) = _PlaceSuggestion;

  factory PlaceSuggestion.fromJson(Map<String, dynamic> json) =>
      _$PlaceSuggestionFromJson(json);
}

@freezed
abstract class PlaceSuggestionResponse with _$PlaceSuggestionResponse {
  const factory PlaceSuggestionResponse({
    @JsonKey(name: 'success') required bool success,
    @JsonKey(name: 'message') required String message,
    @JsonKey(name: 'data') required List<PlaceSuggestion> data,
    @JsonKey(name: 'timestamp') required String timestamp,
  }) = _PlaceSuggestionResponse;

  factory PlaceSuggestionResponse.fromJson(Map<String, dynamic> json) =>
      _$PlaceSuggestionResponseFromJson(json);
}
