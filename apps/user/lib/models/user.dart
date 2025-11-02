// lib/models/user.dart

import 'package:equatable/equatable.dart';
import 'package:json_annotation/json_annotation.dart';
import 'package:objectbox/objectbox.dart';

// ignore_for_file: must_be_immutable

part 'user.g.dart';

@Entity()
@JsonSerializable()
class AppUser extends Equatable {
  AppUser({
    required this.userUuid,
    required this.phoneNumber,
    this.id = 0, // ObjectBox ID, 0 means auto-increment
    this.fullName,
    this.email,
    this.profilePictureUrl,
    this.isVerified = false,
    this.role = 'client',
    this.createdAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => _$AppUserFromJson(json);

  @Id()
  @JsonKey(includeFromJson: false, includeToJson: false)
  int id;

  @JsonKey(name: 'userUuid')
  final String userUuid;

  @JsonKey(name: 'phoneNumber')
  final String phoneNumber;

  @JsonKey(name: 'fullName')
  final String? fullName;

  @JsonKey(name: 'email')
  final String? email;

  @JsonKey(name: 'profilePictureUrl')
  final String? profilePictureUrl;

  @JsonKey(name: 'isVerified')
  final bool isVerified;

  @JsonKey(name: 'role')
  final String role;

  @JsonKey(name: 'createdAt')
  final DateTime? createdAt;

  AppUser copyWith({
    int? id,
    String? userUuid,
    String? phoneNumber,
    String? fullName,
    String? email,
    String? profilePictureUrl,
    bool? isVerified,
    String? role,
    DateTime? createdAt,
  }) => AppUser(
    id: id ?? this.id,
    userUuid: userUuid ?? this.userUuid,
    phoneNumber: phoneNumber ?? this.phoneNumber,
    fullName: fullName ?? this.fullName,
    email: email ?? this.email,
    profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
    isVerified: isVerified ?? this.isVerified,
    role: role ?? this.role,
    createdAt: createdAt ?? this.createdAt,
  );

  Map<String, dynamic> toJson() => _$AppUserToJson(this);

  @override
  List<Object?> get props => [id, userUuid, phoneNumber, fullName, email, profilePictureUrl, isVerified, role, createdAt];

  @override
  String toString() => 'AppUser(id: $id, userUuid: $userUuid, phoneNumber: $phoneNumber, fullName: $fullName, email: $email, role: $role)';
}
