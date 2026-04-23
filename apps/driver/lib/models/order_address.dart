import 'package:freezed_annotation/freezed_annotation.dart';

part 'order_address.freezed.dart';
part 'order_address.g.dart';

/// Mirrors API OrderLocation schema
@freezed
class OrderAddress with _$OrderAddress {
  const factory OrderAddress({
    required String fullAddress,
    required String city,
    required String state,
    required String postalCode,
    required double latitude,
    required double longitude,
    required String contactName,
    required String contactPhone,
    int? addressId,
    String? building,
    String? floor,
    String? flatNumber,
    String? landmark,
    String? howToReach,
  }) = _OrderAddress;

  factory OrderAddress.fromJson(Map<String, dynamic> json) =>
      _$OrderAddressFromJson(json);
}
