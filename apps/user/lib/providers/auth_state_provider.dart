// lib/providers/auth_state_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/user.dart';
import '../utils/logger.dart';
import 'auth_service_provider.dart';
import 'google_auth_provider.dart';
import 'storage_provider.dart';

part 'auth_state_provider.g.dart';

@riverpod
class AuthState extends _$AuthState {
  @override
  Future<AuthStateData> build() async => _checkAuthStatus();

  Future<AuthStateData> _checkAuthStatus() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final accessToken = await storage.read(key: 'access_token');

      if (accessToken == null) {
        return const AuthStateData.unauthenticated();
      }

      // TODO: Implement /users/me endpoint call
      return const AuthStateData.unauthenticated();
    } catch (e) {
      await _clearTokens();
      return const AuthStateData.unauthenticated();
    }
  }

  /// Google Sign-In
  Future<AuthResult> signInWithGoogle({String role = 'client'}) async {
    try {
      final googleAuth = ref.read(googleAuthProvider.notifier);
      final account = await googleAuth.signIn();

      if (account == null) {
        return const AuthResult.error('Google sign-in cancelled');
      }

      final idToken = await googleAuth.getIdToken();
      if (idToken == null) {
        return const AuthResult.error('Failed to get Google ID token');
      }

      final authService = ref.read(authServiceProvider);
      final response = await authService.verifyGoogleToken(idToken, role: role);

      await _storeTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);

      state = AsyncData(AuthStateData.authenticated(response.data.user, isNewUser: response.data.isNewUser));

      return AuthResult.success(response.data.user, isNewUser: response.data.isNewUser);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Register
  Future<AuthResult> register({
    required String fullName,
    required String email,
    required String password,
    required String phoneNumber,
    String role = 'client',
  }) async {
    try {
      final authService = ref.read(authServiceProvider);
      final response = await authService.register(fullName: fullName, email: email, password: password, phoneNumber: phoneNumber, role: role);

      await _storeTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);

      state = AsyncData(AuthStateData.authenticated(response.data.user, isNewUser: response.data.isNewUser));

      return AuthResult.success(response.data.user, isNewUser: response.data.isNewUser);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Login
  Future<AuthResult> login({required String email, required String password}) async {
    try {
      final authService = ref.read(authServiceProvider);
      final response = await authService.login(email: email, password: password);

      AppLogger.d('Login response: ${response.data.toJson()}');

      await _storeTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);

      state = AsyncData(AuthStateData.authenticated(response.data.user));

      return AuthResult.success(response.data.user, isNewUser: false);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Refresh token
  Future<bool> refreshAccessToken() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final refreshToken = await storage.read(key: 'refresh_token');

      if (refreshToken == null) {
        return false;
      }

      final authService = ref.read(authServiceProvider);
      final response = await authService.refreshToken(refreshToken);

      await storage.write(key: 'access_token', value: response.data.accessToken);

      return true;
    } catch (e) {
      await logout();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final accessToken = await storage.read(key: 'access_token');

      if (accessToken != null) {
        final authService = ref.read(authServiceProvider);
        await authService.logout(accessToken);
      }
    } catch (e) {
      // Continue with local logout
    } finally {
      await _clearTokens();

      try {
        final googleAuth = ref.read(googleAuthProvider.notifier);
        await googleAuth.signOut();
      } catch (e) {
        // Ignore
      }

      state = const AsyncData(AuthStateData.unauthenticated());
    }
  }

  Future<void> _storeTokens(String accessToken, String refreshToken) async {
    final storage = ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: accessToken);
    await storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> _clearTokens() async {
    final storage = ref.read(secureStorageProvider);
    await storage.deleteAll();
  }
}

// Auth state classes
sealed class AuthStateData {
  const AuthStateData();
  const factory AuthStateData.authenticated(AppUser user, {bool isNewUser}) = Authenticated;
  const factory AuthStateData.unauthenticated() = Unauthenticated;

  T maybeWhen<T>({required T Function() orElse, T Function(AppUser user, {required bool isNewUser})? authenticated, T Function()? unauthenticated}) {
    if (this is Authenticated) {
      final auth = this as Authenticated;
      return authenticated?.call(auth.user, isNewUser: auth.isNewUser) ?? orElse();
    } else if (this is Unauthenticated) {
      return unauthenticated?.call() ?? orElse();
    } else {
      return orElse();
    }
  }
}

class Authenticated extends AuthStateData {
  const Authenticated(this.user, {this.isNewUser = false});
  final AppUser user;
  final bool isNewUser;
}

class Unauthenticated extends AuthStateData {
  const Unauthenticated();
}

// Auth result
sealed class AuthResult {
  const AuthResult();
  const factory AuthResult.success(AppUser user, {required bool isNewUser}) = AuthSuccess;
  const factory AuthResult.error(String message) = AuthError;

  T when<T>({required T Function(AppUser user, {required bool isNewUser}) success, required T Function(String message) error}) {
    if (this is AuthSuccess) {
      final s = this as AuthSuccess;
      return success(s.user, isNewUser: s.isNewUser);
    } else if (this is AuthError) {
      final e = this as AuthError;
      return error(e.message);
    }
    throw UnsupportedError('Unknown AuthResult');
  }
}

class AuthSuccess extends AuthResult {
  const AuthSuccess(this.user, {required this.isNewUser});
  final AppUser user;
  final bool isNewUser;
}

class AuthError extends AuthResult {
  const AuthError(this.message);
  final String message;
}
