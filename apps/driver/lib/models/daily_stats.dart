import 'package:freezed_annotation/freezed_annotation.dart';

part 'daily_stats.freezed.dart';
part 'daily_stats.g.dart';

@freezed
class DailyStats with _$DailyStats {
  const factory DailyStats({
    @Default(0.0) double earnings,
    @Default(0) int trips,
    @Default(Duration.zero) Duration onlineTime,
    @Default(0.0) double averageRating,
    @Default(0.0) double lastEarning,
  }) = _DailyStats;

  factory DailyStats.fromJson(Map<String, dynamic> json) => _$DailyStatsFromJson(json);
}
