import 'package:freezed_annotation/freezed_annotation.dart';

part 'fare_breakdown.freezed.dart';
part 'fare_breakdown.g.dart';

@freezed
abstract class FareBreakdown with _$FareBreakdown {
  const factory FareBreakdown({
    required double basePrice,
    required double distanceKm,
    required double distancePrice,
    required double weightSurcharge,
    required double totalPrice,
    @Default(0.0) double platformFee,
    @Default(0.0) double specialHandlingFee,
    @Default(0.0) double subtotalBeforeTax,
    @Default(0.0) double gstAmount,
    @Default('INR') String currency,
  }) = _FareBreakdown;

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => _$FareBreakdownFromJson(json);
}
