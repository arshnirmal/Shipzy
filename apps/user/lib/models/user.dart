// lib/models/user.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    @JsonKey(name: 'userId') required int userId,
    @JsonKey(name: 'userUuid') required String userUuid,
    @JsonKey(name: 'role') required String role,
    @JsonKey(name: 'fullName') required String fullName,
    @JsonKey(name: 'email') required String email,
    @JsonKey(name: 'phoneNumber') String? phoneNumber,
    @JsonKey(name: 'createdAt') required String createdAt, @JsonKey(name: 'profilePictureUrl') String? profilePictureUrl,
    @JsonKey(name: 'isVerified') @Default(false) bool isVerified,
    @JsonKey(name: 'isActive') @Default(false) bool isActive,
    @JsonKey(name: 'updatedAt') String? updatedAt,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);
}
