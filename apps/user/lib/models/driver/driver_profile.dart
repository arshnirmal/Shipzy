// lib/models/driver/driver_profile.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import 'vehicle.dart';
import 'earnings.dart';
import 'rating.dart';

part 'driver_profile.freezed.dart';
part 'driver_profile.g.dart';

@freezed
abstract class DriverProfile with _$DriverProfile {
  const factory DriverProfile({
    @JsonKey(name: 'userId') required int userId,
    @JsonKey(name: 'userUuid') required String userUuid,
    @JsonKey(name: 'role') @Default('courier') String role,
    @JsonKey(name: 'fullName') required String fullName,
    @JsonKey(name: 'email') required String email,
    @JsonKey(name: 'phoneNumber') required String phoneNumber,
    @JsonKey(name: 'profilePictureUrl') String? profilePictureUrl,
    @JsonKey(name: 'isVerified') @Default(false) bool isVerified,
    @JsonKey(name: 'isActive') @Default(false) bool isActive,
    @JsonKey(name: 'status') required DriverStatus status,
    @JsonKey(name: 'vehicle') required Vehicle vehicle,
    @JsonKey(name: 'earnings') required Earnings earnings,
    @JsonKey(name: 'rating') required Rating rating,
    @JsonKey(name: 'createdAt') required String createdAt,
    @JsonKey(name: 'updatedAt') required String updatedAt,
  }) = _DriverProfile;

  factory DriverProfile.fromJson(Map<String, dynamic> json) =>
      _$DriverProfileFromJson(json);
}

@freezed
abstract class DriverStatus with _$DriverStatus {
  const factory DriverStatus({
    @JsonKey(name: 'isAvailable') @Default(false) bool isAvailable,
    @JsonKey(name: 'isOnline') @Default(false) bool isOnline,
    @JsonKey(name: 'totalDeliveriesToday') @Default(0) int totalDeliveriesToday,
    @JsonKey(name: 'currentLocation') DriverLocation? currentLocation,
    @JsonKey(name: 'lastLocationUpdate') String? lastLocationUpdate,
  }) = _DriverStatus;

  factory DriverStatus.fromJson(Map<String, dynamic> json) =>
      _$DriverStatusFromJson(json);
}

@freezed
abstract class DriverLocation with _$DriverLocation {
  const factory DriverLocation({
    @JsonKey(name: 'latitude') required double latitude,
    @JsonKey(name: 'longitude') required double longitude,
  }) = _DriverLocation;

  factory DriverLocation.fromJson(Map<String, dynamic> json) =>
      _$DriverLocationFromJson(json);
}
