import 'package:freezed_annotation/freezed_annotation.dart';
import '../utils/date_utils.dart';

part 'delivery_attempt.freezed.dart';
part 'delivery_attempt.g.dart';

@freezed
class DeliveryAttempt with _$DeliveryAttempt {
  @JsonSerializable(converters: [
    IstDateTimeConverter(),
  ])
  const factory DeliveryAttempt({
    required DateTime arrivedAt,
    @JsonKey(
      fromJson: nullableIstDateTimeFromJson,
      toJson: nullableIstDateTimeToJson,
    )
    DateTime? undeliverableAt,
    @JsonKey(
      fromJson: nullableIstDateTimeFromJson,
      toJson: nullableIstDateTimeToJson,
    )
    DateTime? returnStartedAt,
    @JsonKey(
      fromJson: nullableIstDateTimeFromJson,
      toJson: nullableIstDateTimeToJson,
    )
    DateTime? returnedAt,
    String? driverNote,
    String? photoUrl,
    DeliveryGps? gps,
  }) = _DeliveryAttempt;

  factory DeliveryAttempt.fromJson(Map<String, dynamic> json) =>
      _$DeliveryAttemptFromJson(json);
}

@freezed
class DeliveryGps with _$DeliveryGps {
  const factory DeliveryGps({
    required double latitude,
    required double longitude,
  }) = _DeliveryGps;

  factory DeliveryGps.fromJson(Map<String, dynamic> json) =>
      _$DeliveryGpsFromJson(json);
}
