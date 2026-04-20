import 'package:freezed_annotation/freezed_annotation.dart';

import 'driver_kyc_submission.dart';

part 'driver_profile.freezed.dart';
part 'driver_profile.g.dart';

/// One uploaded KYC file (`license` / `insurance` / `vehicleReg` on API `kyc`).
@freezed
class DriverKycDocument with _$DriverKycDocument {
  const factory DriverKycDocument({
    required String url,
    String? number,
    String? expiresAt,
    String? verifiedAt,
  }) = _DriverKycDocument;

  factory DriverKycDocument.fromJson(Map<String, dynamic> json) => _$DriverKycDocumentFromJson(json);
}

/// Mirrors API `driver.kyc` from `GET /drivers/me`.
@freezed
class DriverKycInfo with _$DriverKycInfo {
  const factory DriverKycInfo({
    DriverKycDocument? license,
    DriverKycDocument? insurance,
    DriverKycDocument? vehicleReg,
  }) = _DriverKycInfo;

  factory DriverKycInfo.fromJson(Map<String, dynamic> json) => _$DriverKycInfoFromJson(json);
}

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
    ProfileOnboardingState? onboarding,
    DriverKycInfo? kyc,
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

/// Mirrors API `driver.vehicle.category`.
@freezed
class DriverVehicleCategory with _$DriverVehicleCategory {
  const factory DriverVehicleCategory({
    int? id,
    String? name,
    double? maxWeightKg,
  }) = _DriverVehicleCategory;

  factory DriverVehicleCategory.fromJson(Map<String, dynamic> json) => _$DriverVehicleCategoryFromJson(json);
}

/// Mirrors API `driver.vehicle.specification`.
@freezed
class DriverVehicleSpecification with _$DriverVehicleSpecification {
  const factory DriverVehicleSpecification({
    String? vehicleNumber,
    String? model,
    int? year,
  }) = _DriverVehicleSpecification;

  factory DriverVehicleSpecification.fromJson(Map<String, dynamic> json) => _$DriverVehicleSpecificationFromJson(json);
}

/// Mirrors API BaseDriverCore.vehicle (nested category + specification).
@freezed
class DriverVehicle with _$DriverVehicle {
  const factory DriverVehicle({
    int? vehicleId,
    bool? isActive,
    DriverVehicleCategory? category,
    DriverVehicleSpecification? specification,
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
