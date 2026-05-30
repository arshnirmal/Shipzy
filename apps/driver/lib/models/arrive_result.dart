import 'package:freezed_annotation/freezed_annotation.dart';
import '../utils/date_utils.dart';

part 'arrive_result.freezed.dart';
part 'arrive_result.g.dart';

@freezed
class ArriveResult with _$ArriveResult {
  @JsonSerializable(converters: [
    IstDateTimeConverter(),
  ])
  const factory ArriveResult({
    required DateTime arrivedAt,
    required DateTime waitUntil,
    required int waitMinutes,
  }) = _ArriveResult;

  factory ArriveResult.fromJson(Map<String, dynamic> json) =>
      _$ArriveResultFromJson(json);
}
