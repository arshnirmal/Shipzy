// lib/models/auth/auth_response.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import '../user.dart';

part 'auth_response.freezed.dart';
part 'auth_response.g.dart';

int _expiresInFromJson(dynamic value) {
  if (value is num) {
    return value.toInt();
  }

  if (value is String) {
    final normalized = value.trim().toLowerCase();

    final direct = int.tryParse(normalized);
    if (direct != null) {
      return direct;
    }

    final durationMatch = RegExp(r'^(\d+)\s*(ms|s|m|h|d|w)$').firstMatch(normalized);
    if (durationMatch != null) {
      final amount = int.parse(durationMatch.group(1)!);
      final unit = durationMatch.group(2)!;

      switch (unit) {
        case 'ms':
          return (amount / 1000).ceil();
        case 's':
          return amount;
        case 'm':
          return amount * 60;
        case 'h':
          return amount * 60 * 60;
        case 'd':
          return amount * 60 * 60 * 24;
        case 'w':
          return amount * 60 * 60 * 24 * 7;
      }
    }

    final numericPart = RegExp(r'\d+').firstMatch(normalized)?.group(0);
    if (numericPart != null) {
      return int.parse(numericPart);
    }
  }

  throw FormatException('Invalid expiresIn value: $value');
}

int _expiresInToJson(int value) => value;

/// Login/Register API Response
@freezed
abstract class LoginResponse with _$LoginResponse {
  const factory LoginResponse({required bool success, required String message, required AuthData data, required String timestamp}) = _LoginResponse;

  factory LoginResponse.fromJson(Map<String, dynamic> json) => _$LoginResponseFromJson(json);
}

/// Register API Response (same structure as login)
@freezed
abstract class RegisterResponse with _$RegisterResponse {
  const factory RegisterResponse({required bool success, required String message, required AuthData data, required String timestamp}) =
      _RegisterResponse;

  factory RegisterResponse.fromJson(Map<String, dynamic> json) => _$RegisterResponseFromJson(json);
}

/// Google Auth API Response
@freezed
abstract class GoogleAuthResponse with _$GoogleAuthResponse {
  const factory GoogleAuthResponse({required bool success, required String message, required AuthData data, required String timestamp}) =
      _GoogleAuthResponse;

  factory GoogleAuthResponse.fromJson(Map<String, dynamic> json) => _$GoogleAuthResponseFromJson(json);
}

/// Auth data (user + tokens)
@freezed
abstract class AuthData with _$AuthData {
  const factory AuthData({required AuthActor actor, @JsonKey(name: 'auth') required AuthSectionData authSection}) = _AuthData;

  factory AuthData.fromJson(Map<String, dynamic> json) => _$AuthDataFromJson(json);
}

@freezed
abstract class AuthActor with _$AuthActor {
  const factory AuthActor({required AppUser user}) = _AuthActor;

  factory AuthActor.fromJson(Map<String, dynamic> json) => _$AuthActorFromJson(json);
}

@freezed
abstract class AuthSectionData with _$AuthSectionData {
  const factory AuthSectionData({required AuthTokens tokens, required AuthSession session}) = _AuthSectionData;

  factory AuthSectionData.fromJson(Map<String, dynamic> json) => _$AuthSectionDataFromJson(json);
}

@freezed
abstract class AuthSession with _$AuthSession {
  const factory AuthSession({required String method, @Default(false) bool isNewUser}) = _AuthSession;

  factory AuthSession.fromJson(Map<String, dynamic> json) => _$AuthSessionFromJson(json);
}

/// Token data
@freezed
abstract class AuthTokens with _$AuthTokens {
  const factory AuthTokens({
    @JsonKey(name: 'accessToken') required String accessToken,
    @JsonKey(name: 'refreshToken') required String refreshToken,
    @JsonKey(name: 'expiresIn', fromJson: _expiresInFromJson, toJson: _expiresInToJson) required int expiresIn,
    @JsonKey(name: 'tokenType') @Default('Bearer') String tokenType,
  }) = _AuthTokens;

  factory AuthTokens.fromJson(Map<String, dynamic> json) => _$AuthTokensFromJson(json);
}

/// Refresh token response
@freezed
abstract class RefreshTokenResponse with _$RefreshTokenResponse {
  const factory RefreshTokenResponse({required bool success, required String message, required AuthData data, required String timestamp}) =
      _RefreshTokenResponse;

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) => _$RefreshTokenResponseFromJson(json);
}
