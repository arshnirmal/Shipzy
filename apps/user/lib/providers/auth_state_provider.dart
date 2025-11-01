import 'package:firebase_auth/firebase_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/user.dart';
import 'auth_service_provider.dart';
import 'google_auth_provider.dart';
import 'storage_provider.dart';

part 'auth_state_provider.g.dart';

@riverpod
class AuthState extends _$AuthState {
  @override
  Stream<AuthStateData> build() => FirebaseAuth.instance.authStateChanges().asyncMap((firebaseUser) async {
    if (firebaseUser == null) {
      return const AuthStateData.unauthenticated();
    }

    // Get user data from backend/storage
    final storage = ref.read(secureStorageProvider);
    final accessToken = await storage.read(key: 'access_token');

    if (accessToken == null) {
      return const AuthStateData.unauthenticated();
    }

    // Fetch user profile
    final user = await _fetchUserProfile(firebaseUser.uid);

    return AuthStateData.authenticated(user, isNewUser: user.fullName == null || user.fullName!.isEmpty);
  });

  Future<AppUser> _fetchUserProfile(String uid) async =>
      AppUser(userUuid: uid, phoneNumber: FirebaseAuth.instance.currentUser?.phoneNumber ?? '', fullName: '');

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    final storage = ref.read(secureStorageProvider);
    await storage.deleteAll();
  }

  /// Complete Google authentication by verifying with backend and storing tokens
  Future<AuthResult> completeGoogleAuthentication(String idToken, {String role = 'client'}) async {
    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.verifyGoogleToken(idToken, role: role);

      // Store tokens
      final storage = ref.read(secureStorageProvider);
      await storage.write(key: 'access_token', value: result['accessToken']);
      await storage.write(key: 'refresh_token', value: result['refreshToken']);

      // Create user object
      final userData = result['user'];
      final user = AppUser.fromJson(userData);

      return AuthResult.success(user, result['isNewUser'] as bool);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Register with email and password
  Future<AuthResult> register({
    required String fullName,
    required String email,
    required String password,
    required String phoneNumber,
    String role = 'client',
  }) async {
    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.register(
        fullName: fullName,
        email: email,
        password: password,
        phoneNumber: phoneNumber,
        role: role,
      );

      // Store tokens
      final storage = ref.read(secureStorageProvider);
      final tokens = result['tokens'];
      await storage.write(key: 'access_token', value: tokens['accessToken']);
      await storage.write(key: 'refresh_token', value: tokens['refreshToken']);

      // Create user object
      final userData = result['user'];
      final user = AppUser.fromJson(userData);

      return AuthResult.success(user, result['isNewUser'] as bool);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Login with email and password
  Future<AuthResult> login({
    required String email,
    required String password,
  }) async {
    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.login(email: email, password: password);

      // Store tokens
      final storage = ref.read(secureStorageProvider);
      await storage.write(key: 'access_token', value: result['accessToken']);
      await storage.write(key: 'refresh_token', value: result['refreshToken']);

      // Create user object
      final userData = result['user'];
      final user = AppUser.fromJson(userData);

      return AuthResult.success(user, result['isNewUser'] as bool);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Refresh access token
  Future<bool> refreshAccessToken() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final refreshToken = await storage.read(key: 'refresh_token');

      if (refreshToken == null) {
        return false;
      }

      final authService = ref.read(authServiceProvider);
      final result = await authService.refreshToken(refreshToken);

      // Update access token
      await storage.write(key: 'access_token', value: result['accessToken']);

      return true;
    } catch (e) {
      // If refresh fails, clear tokens
      await signOut();
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final accessToken = await storage.read(key: 'access_token');

      if (accessToken != null) {
        final authService = ref.read(authServiceProvider);
        await authService.logout(accessToken);
      }
    } catch (e) {
      // Continue with local logout even if API call fails
    } finally {
      // Clear local storage
      final storage = ref.read(secureStorageProvider);
      await storage.deleteAll();

      // Sign out from Google if signed in
      try {
        final googleAuth = ref.read(googleAuthProvider);
        await googleAuth.signOut();
      } catch (e) {
        // Ignore Google sign-out errors
      }
    }
  }

  /// Legacy method for backward compatibility
  @deprecated
  Future<AuthResult> completeAuthentication(String idToken, {String? fullName, String? email}) async {
    return completeGoogleAuthentication(idToken);
  }
}

// Auth state sealed class
sealed class AuthStateData {
  const AuthStateData();

  const factory AuthStateData.authenticated(AppUser user, {bool isNewUser}) = Authenticated;
  const factory AuthStateData.unauthenticated() = Unauthenticated;

  T when<T>({required T Function(AppUser user, bool isNewUser) authenticated, required T Function() unauthenticated}) {
    final state = this;
    if (state is Authenticated) {
      return authenticated(state.user, state.isNewUser);
    } else {
      return unauthenticated();
    }
  }

  T maybeWhen<T>({required T Function() orElse, T Function(AppUser user, bool isNewUser)? authenticated, T Function()? unauthenticated}) {
    final state = this;
    if (state is Authenticated && authenticated != null) {
      return authenticated(state.user, state.isNewUser);
    } else if (state is Unauthenticated && unauthenticated != null) {
      return unauthenticated();
    }
    return orElse();
  }
}

class Authenticated extends AuthStateData {
  const Authenticated(this.user, {bool isNewUser = false}) : isNewUser = isNewUser;
  final AppUser user;
  final bool isNewUser;
}

class Unauthenticated extends AuthStateData {
  const Unauthenticated();
}

// Auth result for handling authentication completion
sealed class AuthResult {
  const AuthResult();

  const factory AuthResult.success(AppUser user, bool isNewUser) = AuthSuccess;
  const factory AuthResult.error(String message) = AuthError;

  T when<T>({required T Function(AppUser user, bool isNewUser) success, required T Function(String message) error}) {
    final result = this;
    if (result is AuthSuccess) {
      return success(result.user, result.isNewUser);
    } else if (result is AuthError) {
      return error(result.message);
    }
    throw UnsupportedError('Unknown AuthResult type');
  }
}

class AuthSuccess extends AuthResult {
  const AuthSuccess(this.user, this.isNewUser);
  final AppUser user;
  final bool isNewUser;
}

class AuthError extends AuthResult {
  const AuthError(this.message);
  final String message;
}
