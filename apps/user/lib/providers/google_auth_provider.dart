import 'package:google_sign_in/google_sign_in.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'google_auth_provider.g.dart';

@riverpod
class GoogleAuth extends _$GoogleAuth {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      'email',
      'profile',
      'openid',
    ],
  );

  @override
  GoogleSignInAccount? build() {
    return null;
  }

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

  Future<String?> getIdToken() async {
    try {
      final account = await _googleSignIn.currentUser;
      if (account == null) {
        throw Exception('No Google account signed in');
      }

      final auth = await account.authentication;
      return auth.idToken;
    } catch (error) {
      throw Exception('Failed to get ID token: $error');
    }
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
      state = null;
    } catch (error) {
      throw Exception('Google sign-out failed: $error');
    }
  }

  Future<void> disconnect() async {
    try {
      await _googleSignIn.disconnect();
      state = null;
    } catch (error) {
      throw Exception('Google disconnect failed: $error');
    }
  }

  Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  Future<GoogleSignInAccount?> getCurrentUser() async {
    return _googleSignIn.currentUser;
  }
}
