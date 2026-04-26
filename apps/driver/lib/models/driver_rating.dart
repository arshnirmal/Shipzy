import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver_rating.freezed.dart';
part 'driver_rating.g.dart';

/// Mirrors API GET /drivers/me/rating response under data.rating
@freezed
class DriverRatingStats with _$DriverRatingStats {
  const factory DriverRatingStats({
    required double averageRating,
    required int totalRatings,
    required DriverRatingDistribution ratingDistribution,
    required String lastUpdated,
  }) = _DriverRatingStats;

  factory DriverRatingStats.fromJson(Map<String, dynamic> json) =>
      _$DriverRatingStatsFromJson(json);
}

/// Mirrors API ratingDistribution { 1, 2, 3, 4, 5 }
@freezed
class DriverRatingDistribution with _$DriverRatingDistribution {
  const factory DriverRatingDistribution({
    @JsonKey(name: '1') @Default(0) int one,
    @JsonKey(name: '2') @Default(0) int two,
    @JsonKey(name: '3') @Default(0) int three,
    @JsonKey(name: '4') @Default(0) int four,
    @JsonKey(name: '5') @Default(0) int five,
  }) = _DriverRatingDistribution;

  factory DriverRatingDistribution.fromJson(Map<String, dynamic> json) =>
      _$DriverRatingDistributionFromJson(json);
}
