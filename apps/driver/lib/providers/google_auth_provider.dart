// lib/providers/google_auth_provider.dart

import 'package:google_sign_in/google_sign_in.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'google_auth_provider.g.dart';

@riverpod
class GoogleAuth extends _$GoogleAuth {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile', 'openid'],
  );

  @override
  GoogleSignInAccount? build() => null;

  /// Sign in with Google
  Future<GoogleSignInAccount?> signIn() async {
    try {
      final account = await _googleSignIn.signIn();
      state = account;
      return account;
    } catch (error) {
      state = null;
      throw Exception('Google sign-in failed: $error');
    }
  }

  /// Get Google ID token
  Future<String?> getIdToken() async {
    try {
      final account = _googleSignIn.currentUser ?? state;
      if (account == null) {
        throw Exception('No Google account signed in');
      }

      final auth = await account.authentication;
      return auth.idToken;
    } catch (error) {
      throw Exception('Failed to get ID token: $error');
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      state = null;
    } catch (error) {
      throw Exception('Google sign-out failed: $error');
    }
  }

  /// Disconnect Google account
  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
      state = null;
    } catch (error) {
      // Ignore disconnect errors (user might not be connected)
    }
  }

  /// Check if user is signed in
  Future<bool> isSignedIn() async => _googleSignIn.isSignedIn();

  /// Get current Google user
  Future<GoogleSignInAccount?> getCurrentUser() async =>
      _googleSignIn.currentUser;
}
