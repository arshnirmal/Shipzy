// lib/providers/storage_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

part 'storage_provider.g.dart';

// ============ SECURE STORAGE (for tokens) ============

@Riverpod(keepAlive: true)
FlutterSecureStorage secureStorage(Ref ref) => const FlutterSecureStorage(
  aOptions: AndroidOptions(encryptedSharedPreferences: true),
  iOptions: IOSOptions(accessibility: KeychainAccessibility.first_unlock),
);

// ============ SHARED PREFERENCES (for app settings) ============

@Riverpod(keepAlive: true)
Future<SharedPreferences> sharedPreferences(Ref ref) async =>
    SharedPreferences.getInstance();

// ============ TOKEN STORAGE HELPER ============

@riverpod
TokenStorage tokenStorage(Ref ref) => TokenStorage(ref);

/// Helper class for token management
class TokenStorage {
  TokenStorage(this._ref);

  final Ref _ref;

  FlutterSecureStorage get _storage => _ref.read(secureStorageProvider);

  // Token keys
  static const _accessTokenKey = 'access_token';
  static const _refreshTokenKey = 'refresh_token';

  /// Save both access and refresh tokens
  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await Future.wait([
      _storage.write(key: _accessTokenKey, value: accessToken),
      _storage.write(key: _refreshTokenKey, value: refreshToken),
    ]);
  }

  /// Get access token
  Future<String?> getAccessToken() async => _storage.read(key: _accessTokenKey);

  /// Get refresh token
  Future<String?> getRefreshToken() async =>
      _storage.read(key: _refreshTokenKey);

  /// Update only access token (used during token refresh)
  Future<void> updateAccessToken(String accessToken) async {
    await _storage.write(key: _accessTokenKey, value: accessToken);
  }

  /// Clear all tokens (logout)
  Future<void> clearTokens() async {
    await Future.wait([
      _storage.delete(key: _accessTokenKey),
      _storage.delete(key: _refreshTokenKey),
    ]);
  }

  /// Clear all secure storage data
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }

  /// Check if user has tokens
  Future<bool> hasTokens() async {
    final accessToken = await getAccessToken();
    final refreshToken = await getRefreshToken();
    return accessToken != null && refreshToken != null;
  }
}
