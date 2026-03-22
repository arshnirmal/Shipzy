// lib/models/driver/earnings.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'earnings.freezed.dart';
part 'earnings.g.dart';

@freezed
abstract class Earnings with _$Earnings {
  const factory Earnings({
    @JsonKey(name: 'total') required double total,
    @JsonKey(name: 'today') required double today,
    @JsonKey(name: 'thisWeek') required double thisWeek,
    @JsonKey(name: 'thisMonth') required double thisMonth,
    @JsonKey(name: 'averageOrderValue') required double averageOrderValue,
    @JsonKey(name: 'totalDistanceKm') required double totalDistanceKm,
  }) = _Earnings;

  factory Earnings.fromJson(Map<String, dynamic> json) =>
      _$EarningsFromJson(json);
}
