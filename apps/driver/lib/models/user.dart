// lib/models/user.dart

import 'package:freezed_annotation/freezed_annotation.dart';

part 'user.freezed.dart';
part 'user.g.dart';

@freezed
abstract class AppUser with _$AppUser {
  const factory AppUser({
    @JsonKey(name: 'userId') required int userId,
    @JsonKey(name: 'userUuid') required String userUuid,
    @JsonKey(name: 'email') required String email,
    @JsonKey(name: 'fullName') required String fullName,
    @JsonKey(name: 'phoneNumber') String? phoneNumber,
    @JsonKey(name: 'firebaseUid') String? firebaseUid,
    @JsonKey(name: 'profilePictureUrl') String? profilePictureUrl,
    @JsonKey(name: 'isVerified') @Default(false) bool isVerified,
    @JsonKey(name: 'role') @Default('driver') String role,
    @JsonKey(name: 'profileComplete') @Default(false) bool profileComplete,
    @JsonKey(name: 'createdAt') DateTime? createdAt,
    @JsonKey(name: 'updatedAt') DateTime? updatedAt,
  }) = _AppUser;

  factory AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);
}
