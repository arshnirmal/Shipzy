// lib/models/driver/rating.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'rating.freezed.dart';
part 'rating.g.dart';

@freezed
abstract class Rating with _$Rating {
  const factory Rating({
    @JsonKey(name: 'averageRating') required double averageRating,
    @JsonKey(name: 'totalRatings') required int totalRatings,
  }) = _Rating;

  factory Rating.fromJson(Map<String, dynamic> json) =>
      _$RatingFromJson(json);
}
