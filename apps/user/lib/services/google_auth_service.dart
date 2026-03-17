// lib/services/google_auth_service.dart

import 'package:dio/dio.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../utils/logger.dart';

class GoogleAuthService {
  GoogleAuthService(this._dio);

  factory GoogleAuthService.create({Dio? dio}) => GoogleAuthService(dio ?? Dio());
  final Dio _dio;

  /// Sign in with Google and get ID token for API verification
  Future<GoogleSignInAccount?> signIn() async {
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'https://www.googleapis.com/auth/contacts.readonly']);

      // Attempt silent sign in first
      final account = await googleSignIn.signInSilently();
      if (account != null) {
        return account;
      }

      // If silent sign in fails, show interactive sign in
      return await googleSignIn.signIn();
    } catch (e) {
      AppLogger.e('Google sign in error: $e');
      return null;
    }
  }

  /// Sign out from Google
  Future<void> signOut() async {
    try {
      final googleSignIn = GoogleSignIn();
      await googleSignIn.signOut();
    } catch (e) {
      AppLogger.e('Google sign out error: $e');
    }
  }

  /// Exchange Google ID token for backend authentication
  Future<Map<String, dynamic>?> verifyTokenWithBackend(String idToken) async {
    try {
      final response = await _dio.post('/auth/google/verify', data: {'idToken': idToken});

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['success'] == true) {
          return data['data'];
        }
      }
      return null;
    } catch (e) {
      AppLogger.e('Backend token verification error: $e');
      return null;
    }
  }
}
