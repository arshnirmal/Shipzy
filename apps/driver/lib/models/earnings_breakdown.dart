import 'package:freezed_annotation/freezed_annotation.dart';

part 'earnings_breakdown.freezed.dart';
part 'earnings_breakdown.g.dart';

@freezed
class EarningsBreakdown with _$EarningsBreakdown {
  const factory EarningsBreakdown({
    required double basePayout,
    required double distanceEarning,
    required double weightCompensation,
    required double peakHourBonus,
    required double urgencyBonus,
    required double onTimeBonus,
    required double qualityBonus,
    required double platformCommission,
    required double customerTip,
    required double grossEarning,
    required double netEarning,
  }) = _EarningsBreakdown;

  factory EarningsBreakdown.fromJson(Map<String, dynamic> json) =>
      _$EarningsBreakdownFromJson(json);
}
