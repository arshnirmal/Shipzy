// lib/models/saved_address.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'saved_address.freezed.dart';
part 'saved_address.g.dart';

@freezed
abstract class SavedAddress with _$SavedAddress {
  const factory SavedAddress({
    @JsonKey(name: 'addressId') required int addressId,
    @JsonKey(name: 'fullAddress') required String fullAddress,
    @JsonKey(name: 'city') required String city,
    @JsonKey(name: 'state') required String state,
    @JsonKey(name: 'postalCode') required String postalCode,
    @JsonKey(name: 'latitude') required double latitude,
    @JsonKey(name: 'longitude') required double longitude,
    @JsonKey(name: 'addressType') required String addressType,
    @JsonKey(name: 'label') required String label,
    @JsonKey(name: 'createdAt') required String createdAt,
    @JsonKey(name: 'building') String? building,
    @JsonKey(name: 'floor') String? floor,
    @JsonKey(name: 'flat') String? flat,
    @JsonKey(name: 'landmark') String? landmark,
    @JsonKey(name: 'isDefault') @Default(false) bool isDefault,
  }) = _SavedAddress;

  factory SavedAddress.fromJson(Map<String, dynamic> json) => _$SavedAddressFromJson(json);
}

// For creating new addresses (without addressId and timestamps)
@freezed
abstract class CreateAddress with _$CreateAddress {
  const factory CreateAddress({
    @JsonKey(name: 'fullAddress') required String fullAddress,
    @JsonKey(name: 'city') required String city,
    @JsonKey(name: 'state') required String state,
    @JsonKey(name: 'postalCode') required String postalCode,
    @JsonKey(name: 'latitude') required double latitude,
    @JsonKey(name: 'longitude') required double longitude,
    @JsonKey(name: 'building') String? building,
    @JsonKey(name: 'floor') String? floor,
    @JsonKey(name: 'flat') String? flat,
    @JsonKey(name: 'landmark') String? landmark,
    @JsonKey(name: 'addressType') String? addressType,
    @JsonKey(name: 'label') String? label,
    @JsonKey(name: 'isDefault') @Default(false) bool isDefault,
  }) = _CreateAddress;

  factory CreateAddress.fromJson(Map<String, dynamic> json) => _$CreateAddressFromJson(json);
}
