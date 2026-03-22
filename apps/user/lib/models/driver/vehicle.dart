// lib/models/driver/vehicle.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'vehicle.freezed.dart';
part 'vehicle.g.dart';

@freezed
abstract class Vehicle with _$Vehicle {
  const factory Vehicle({
    @JsonKey(name: 'vehicleId') required int vehicleId,
    @JsonKey(name: 'categoryId') required int categoryId,
    @JsonKey(name: 'category') required String category,
    @JsonKey(name: 'vehicleNumber') required String vehicleNumber, @JsonKey(name: 'model') required String model, @JsonKey(name: 'year') required int year, @JsonKey(name: 'isActive') @Default(false) bool isActive,
  }) = _Vehicle;

  factory Vehicle.fromJson(Map<String, dynamic> json) =>
      _$VehicleFromJson(json);
}
