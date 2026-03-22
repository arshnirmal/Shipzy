// lib/models/auth/auth_response.dart

import 'package:freezed_annotation/freezed_annotation.dart';

import '../user.dart';

part 'auth_response.freezed.dart';
part 'auth_response.g.dart';

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
  const factory AuthData({required AppUser user, required AuthTokens tokens, @Default(false) bool isNewUser}) = _AuthData;

  factory AuthData.fromJson(Map<String, dynamic> json) => _$AuthDataFromJson(json);
}

/// Token data
@freezed
abstract class AuthTokens with _$AuthTokens {
  const factory AuthTokens({
    @JsonKey(name: 'accessToken') required String accessToken,
    @JsonKey(name: 'refreshToken') required String refreshToken,
    @JsonKey(name: 'expiresIn') required int expiresIn,
    @JsonKey(name: 'tokenType') @Default('Bearer') String tokenType,
  }) = _AuthTokens;

  factory AuthTokens.fromJson(Map<String, dynamic> json) => _$AuthTokensFromJson(json);
}

/// Refresh token response
@freezed
abstract class RefreshTokenResponse with _$RefreshTokenResponse {
  const factory RefreshTokenResponse({required bool success, required String message, required RefreshTokenData data, required String timestamp}) =
      _RefreshTokenResponse;

  factory RefreshTokenResponse.fromJson(Map<String, dynamic> json) => _$RefreshTokenResponseFromJson(json);
}

/// Refresh token data
@freezed
abstract class RefreshTokenData with _$RefreshTokenData {
  const factory RefreshTokenData({
    required String accessToken,
    required String refreshToken,
    required int expiresIn,
    @Default('Bearer') String tokenType,
  }) = _RefreshTokenData;

  factory RefreshTokenData.fromJson(Map<String, dynamic> json) => _$RefreshTokenDataFromJson(json);
}
