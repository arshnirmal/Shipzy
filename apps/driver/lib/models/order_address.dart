import 'package:freezed_annotation/freezed_annotation.dart';

part 'order_address.freezed.dart';
part 'order_address.g.dart';

@freezed
class OrderAddress with _$OrderAddress {
  const factory OrderAddress({
    required String address,
    required String city,
    required String state,
    String? building,
    String? landmark,
    String? contactName,
    String? contactPhone,
    String? postalCode,
    double? latitude,
    double? longitude,
  }) = _OrderAddress;

  factory OrderAddress.fromJson(Map<String, dynamic> json) => _$OrderAddressFromJson(json);
}
