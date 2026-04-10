import 'package:freezed_annotation/freezed_annotation.dart';

part 'earnings_summary.freezed.dart';
part 'earnings_summary.g.dart';

/// Mirrors API GET /drivers/me/earnings response under data.earnings
@freezed
class EarningsSummary with _$EarningsSummary {
  const factory EarningsSummary({
    required EarningsScopeData scope,
    required EarningsDeliveriesData deliveries,
    required EarningsAmountData earnings,
    required EarningsActivityData activity,
  }) = _EarningsSummary;

  factory EarningsSummary.fromJson(Map<String, dynamic> json) => _$EarningsSummaryFromJson(json);
}

/// Mirrors API scope block { period }
@freezed
class EarningsScopeData with _$EarningsScopeData {
  const factory EarningsScopeData({required String period}) = _EarningsScopeData;

  factory EarningsScopeData.fromJson(Map<String, dynamic> json) => _$EarningsScopeDataFromJson(json);
}

/// Mirrors API deliveries block
@freezed
class EarningsDeliveriesData with _$EarningsDeliveriesData {
  const factory EarningsDeliveriesData({
    @Default(0) int today,
    @Default(0) int total,
    @Default(0) int thisWeek,
    @Default(0) int thisMonth,
  }) = _EarningsDeliveriesData;

  factory EarningsDeliveriesData.fromJson(Map<String, dynamic> json) => _$EarningsDeliveriesDataFromJson(json);
}

/// Mirrors API earnings block
@freezed
class EarningsAmountData with _$EarningsAmountData {
  const factory EarningsAmountData({
    @Default(0.0) double today,
    @Default(0.0) double total,
    @Default(0.0) double thisWeek,
    @Default(0.0) double thisMonth,
    @Default(0.0) double averageOrderValue,
  }) = _EarningsAmountData;

  factory EarningsAmountData.fromJson(Map<String, dynamic> json) => _$EarningsAmountDataFromJson(json);
}

/// Mirrors API activity block { totalDistanceKm }
@freezed
class EarningsActivityData with _$EarningsActivityData {
  const factory EarningsActivityData({@Default(0.0) double totalDistanceKm}) = _EarningsActivityData;

  factory EarningsActivityData.fromJson(Map<String, dynamic> json) => _$EarningsActivityDataFromJson(json);
}
