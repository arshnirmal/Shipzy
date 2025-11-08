// lib/models/saved_address.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'saved_address.freezed.dart';
part 'saved_address.g.dart';

@freezed
abstract class SavedAddress with _$SavedAddress {
  const factory SavedAddress({
    required String label,
    required String fullAddress,
    required double latitude,
    required double longitude,
    int? addressId, // null for current location
    String? addressType, // "home", "work", etc.
    String? building,
    String? floor,
    String? flatNumber,
    String? landmark,
    String? city, // optional for current location
    String? state, // optional for current location
    String? postalCode, // optional for current location
    @Default(false) bool isDefault,
    @Default(false) bool isCurrentLocation,
    DateTime? createdAt,
  }) = _SavedAddress;

  factory SavedAddress.fromJson(Map<String, dynamic> json) => _$SavedAddressFromJson(json);
}

// For creating new addresses (without addressId and timestamps)
@freezed
abstract class CreateAddress with _$CreateAddress {
  const factory CreateAddress({
    required String label,
    required String fullAddress,
    required String city,
    required String state,
    required String postalCode,
    required double latitude,
    required double longitude,
    String? addressType,
    String? building,
    String? floor,
    String? flatNumber,
    String? landmark,
    @Default(false) bool isDefault,
  }) = _CreateAddress;

  factory CreateAddress.fromJson(Map<String, dynamic> json) => _$CreateAddressFromJson(json);
}
