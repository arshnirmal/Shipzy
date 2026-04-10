import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver_profile.freezed.dart';
part 'driver_profile.g.dart';

/// Mirrors API BaseDriver (BaseDriverCore + earnings + rating)
@freezed
class DriverProfile with _$DriverProfile {
  const factory DriverProfile({
    required int userId,
    required String userUuid,
    required String fullName,
    String? email,
    String? phoneNumber,
    String? profilePictureUrl,
    @Default(false) bool isVerified,
    @Default(false) bool isActive,
    DriverStatusInfo? status,
    DriverVehicle? vehicle,
    DriverEarnings? earnings,
    DriverRatingSummary? rating,
    String? createdAt,
    String? updatedAt,
  }) = _DriverProfile;

  factory DriverProfile.fromJson(Map<String, dynamic> json) => _$DriverProfileFromJson(json);
}

/// Mirrors API BaseDriverCore.status
/// Named DriverStatusInfo (not DriverStatus) to avoid conflict with the DriverStatus enum in driver_home_state.dart
@freezed
class DriverStatusInfo with _$DriverStatusInfo {
  const factory DriverStatusInfo({
    @Default(false) bool isAvailable,
    @Default(false) bool isOnline,
    @Default(0) int totalDeliveriesToday,
    DriverCoordinates? currentLocation,
    String? lastLocationUpdate,
  }) = _DriverStatusInfo;

  factory DriverStatusInfo.fromJson(Map<String, dynamic> json) => _$DriverStatusInfoFromJson(json);
}

/// Mirrors API Coordinates schema
@freezed
class DriverCoordinates with _$DriverCoordinates {
  const factory DriverCoordinates({required double latitude, required double longitude}) = _DriverCoordinates;

  factory DriverCoordinates.fromJson(Map<String, dynamic> json) => _$DriverCoordinatesFromJson(json);
}

/// Mirrors API BaseDriverCore.vehicle — all fields optional per API
@freezed
class DriverVehicle with _$DriverVehicle {
  const factory DriverVehicle({
    int? vehicleId,
    int? categoryId,
    String? category,
    bool? isActive,
    String? vehicleNumber,
    String? model,
    int? year,
  }) = _DriverVehicle;

  factory DriverVehicle.fromJson(Map<String, dynamic> json) => _$DriverVehicleFromJson(json);
}

/// Mirrors API BaseDriver.earnings
@freezed
class DriverEarnings with _$DriverEarnings {
  const factory DriverEarnings({
    @Default(0.0) double total,
    @Default(0.0) double today,
    @Default(0.0) double thisWeek,
    @Default(0.0) double thisMonth,
    @Default(0.0) double averageOrderValue,
    @Default(0.0) double totalDistanceKm,
  }) = _DriverEarnings;

  factory DriverEarnings.fromJson(Map<String, dynamic> json) => _$DriverEarningsFromJson(json);
}

/// Mirrors API BaseDriver.rating
@freezed
class DriverRatingSummary with _$DriverRatingSummary {
  const factory DriverRatingSummary({
    @Default(0.0) double averageRating,
    @Default(0) int totalRatings,
  }) = _DriverRatingSummary;

  factory DriverRatingSummary.fromJson(Map<String, dynamic> json) => _$DriverRatingSummaryFromJson(json);
}
