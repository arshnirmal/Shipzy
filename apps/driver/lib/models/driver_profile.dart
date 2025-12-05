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
    DriverEarningsData? earnings,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) = _DriverProfile;

  factory DriverProfile.fromJson(Map<String, dynamic> json) => _$DriverProfileFromJson(json);
}

@freezed
class DriverStatusData with _$DriverStatusData {
  const factory DriverStatusData({
    @Default(false) bool isAvailable,
    @Default(false) bool isOnline,
    @Default(0) int totalDeliveriesToday,
    LastActiveLocationData? lastActiveLocation,
  }) = _DriverStatusData;

  factory DriverStatusData.fromJson(Map<String, dynamic> json) => _$DriverStatusDataFromJson(json);
}

@freezed
class LastActiveLocationData with _$LastActiveLocationData {
  const factory LastActiveLocationData({required double latitude, required double longitude, required DateTime updatedAt}) = _LastActiveLocationData;

  factory LastActiveLocationData.fromJson(Map<String, dynamic> json) => _$LastActiveLocationDataFromJson(json);
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

@freezed
class DriverEarningsData with _$DriverEarningsData {
  const factory DriverEarningsData({
    @Default(0) double total,
    @Default(0) double today,
    @Default(0) double thisWeek,
    @Default(0) double thisMonth,
    @Default(0) double averageOrderValue,
    @Default(0) double totalDistanceKm,
  }) = _DriverEarningsData;

  factory DriverEarningsData.fromJson(Map<String, dynamic> json) => _$DriverEarningsDataFromJson(json);
}
