import 'package:freezed_annotation/freezed_annotation.dart';

part 'static_vehicle_category.freezed.dart';
part 'static_vehicle_category.g.dart';

double _maxWeightKgFromJson(Object? json) {
  if (json is num) {
    return json.toDouble();
  }
  if (json is String) {
    return double.tryParse(json) ?? 0;
  }
  return 0;
}

/// Row from `GET /api/v1/static/vehicle-categories` (`VehicleCategoryZ` on the backend).
@freezed
class StaticVehicleCategory with _$StaticVehicleCategory {
  const factory StaticVehicleCategory({
    @JsonKey(name: 'categoryId') required int categoryId,
    required String name,
    @JsonKey(name: 'maxWeightKg', fromJson: _maxWeightKgFromJson)
    required double maxWeightKg,
    String? displayName,
    String? description,
    String? iconUrl,
    @JsonKey(name: 'isActive') @Default(true) bool isActive,
  }) = _StaticVehicleCategory;

  factory StaticVehicleCategory.fromJson(Map<String, dynamic> json) =>
      _$StaticVehicleCategoryFromJson(json);
}
