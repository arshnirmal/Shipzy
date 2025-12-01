import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver_profile.freezed.dart';
part 'driver_profile.g.dart';

@freezed
class DriverProfile with _$DriverProfile {
  const factory DriverProfile({
    required int userId,
    required String userUuid,
    required String fullName,
    required String email,
    String? phoneNumber,
    String? profilePictureUrl,
    @Default(false) bool isVerified,
    @Default(false) bool isActive,
    DriverStatusData? status,
    VehicleData? vehicle,
  }) = _DriverProfile;

  factory DriverProfile.fromJson(Map<String, dynamic> json) => _$DriverProfileFromJson(json);
}

@freezed
class DriverStatusData with _$DriverStatusData {
  const factory DriverStatusData({
    @Default(false) bool isAvailable,
    @Default(false) bool isOnline,
    @Default(0) int totalDeliveriesToday,
    LocationData? currentLocation,
  }) = _DriverStatusData;

  factory DriverStatusData.fromJson(Map<String, dynamic> json) => _$DriverStatusDataFromJson(json);
}

@freezed
class LocationData with _$LocationData {
  const factory LocationData({required double latitude, required double longitude}) = _LocationData;

  factory LocationData.fromJson(Map<String, dynamic> json) => _$LocationDataFromJson(json);
}

@freezed
class VehicleData with _$VehicleData {
  const factory VehicleData({
    required int vehicleId,
    required String vehicleNumber,
    required String model,
    required int year,
    required String category,
    required double capacity,
  }) = _VehicleData;

  factory VehicleData.fromJson(Map<String, dynamic> json) => _$VehicleDataFromJson(json);
}
