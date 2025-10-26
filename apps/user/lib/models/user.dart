import 'package:equatable/equatable.dart';
import 'package:objectbox/objectbox.dart';

// ignore_for_file: must_be_immutable
@Entity()
class AppUser extends Equatable {
  AppUser({
    this.id = 0, // ObjectBox ID, 0 means auto-increment
    required this.userUuid,
    required this.phoneNumber,
    this.fullName,
    this.email,
    this.profilePictureUrl,
    this.isVerified = false,
    this.role = 'client',
    this.createdAt,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) => AppUser(
    id: json['id'] as int? ?? 0,
    userUuid: json['userUuid'] as String,
    phoneNumber: json['phoneNumber'] as String,
    fullName: json['fullName'] as String?,
    email: json['email'] as String?,
    profilePictureUrl: json['profilePictureUrl'] as String?,
    isVerified: json['isVerified'] as bool? ?? false,
    role: json['role'] as String? ?? 'client',
    createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt'] as String) : null,
  );

  @Id()
  int id;
  final String userUuid;
  final String phoneNumber;
  final String? fullName;
  final String? email;
  final String? profilePictureUrl;
  final bool isVerified;
  final String role;
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

  // Factory method for creating new users (ObjectBox will assign ID)
  factory AppUser.create({
    required String userUuid,
    required String phoneNumber,
    String? fullName,
    String? email,
    String? profilePictureUrl,
    bool isVerified = false,
    String role = 'client',
    DateTime? createdAt,
  }) => AppUser(
    userUuid: userUuid,
    phoneNumber: phoneNumber,
    fullName: fullName,
    email: email,
    profilePictureUrl: profilePictureUrl,
    isVerified: isVerified,
    role: role,
    createdAt: createdAt,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'userUuid': userUuid,
    'phoneNumber': phoneNumber,
    'fullName': fullName,
    'email': email,
    'profilePictureUrl': profilePictureUrl,
    'isVerified': isVerified,
    'role': role,
    'createdAt': createdAt?.toIso8601String(),
  };

  @override
  List<Object?> get props => [id, userUuid, phoneNumber, fullName, email, profilePictureUrl, isVerified, role, createdAt];

  @override
  String toString() => 'AppUser(id: $id, userUuid: $userUuid, phoneNumber: $phoneNumber, fullName: $fullName, email: $email, role: $role)';
}
