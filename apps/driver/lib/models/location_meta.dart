import 'package:freezed_annotation/freezed_annotation.dart';

part 'location_meta.freezed.dart';
part 'location_meta.g.dart';

@freezed
class LocationMeta with _$LocationMeta {
  const factory LocationMeta({
    double? speed,
    double? bearing,
    double? accuracy,
  }) = _LocationMeta;

  factory LocationMeta.fromJson(Map<String, dynamic> json) =>
      _$LocationMetaFromJson(json);
}
