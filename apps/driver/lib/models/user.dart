// lib/models/user.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    @JsonKey(name: 'userId') required int userId,
    @JsonKey(name: 'userUuid') required String userUuid,
    @JsonKey(name: 'fullName') required String fullName,
    @JsonKey(name: 'role') @Default('courier') String role,
    @JsonKey(name: 'email') String? email,
    @JsonKey(name: 'phoneNumber') String? phoneNumber,
    @JsonKey(name: 'profilePictureUrl') String? profilePictureUrl,
    @JsonKey(name: 'isVerified') @Default(false) bool isVerified,
    @JsonKey(name: 'isActive') @Default(false) bool isActive,
    @JsonKey(name: 'createdAt') String? createdAt,
    @JsonKey(name: 'updatedAt') String? updatedAt,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) =>
      _$AppUserFromJson(json);
}
