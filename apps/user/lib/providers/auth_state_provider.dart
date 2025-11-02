// lib/providers/auth_state_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/user.dart';
import 'auth_service_provider.dart';
import 'google_auth_provider.dart';
import 'storage_provider.dart';

part 'auth_state_provider.g.dart';

@riverpod
class AuthState extends _$AuthState {
  @override
  Future<AuthStateData> build() async => _checkAuthStatus();

  /// Check if user has valid tokens
  Future<AuthStateData> _checkAuthStatus() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final accessToken = await storage.read(key: 'access_token');

      if (accessToken == null) {
        return const AuthStateData.unauthenticated();
      }

      // Fetch user profile from backend
      final user = await _fetchUserProfile();
      if (user == null) {
        return const AuthStateData.unauthenticated();
      }

      return AuthStateData.authenticated(user);
    } catch (e) {
      // If token is invalid, clear and return unauthenticated
      await _clearTokens();
      return const AuthStateData.unauthenticated();
    }
  }

  /// Fetch user profile from backend using stored token
  Future<AppUser?> _fetchUserProfile() async {
    try {
      // TODO: Call your backend's /users/me endpoint
      // For now, return null (you'll implement this when you have the endpoint)
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Google Sign-In Flow
  Future<AuthResult> signInWithGoogle({String role = 'client'}) async {
    try {
      // Step 1: Sign in with Google SDK
      final googleAuth = ref.read(googleAuthProvider.notifier);
      final account = await googleAuth.signIn();

      if (account == null) {
        return const AuthResult.error('Google sign-in cancelled');
      }

      // Step 2: Get ID token
      final idToken = await googleAuth.getIdToken();

      if (idToken == null) {
        return const AuthResult.error('Failed to get Google ID token');
      }

      // Step 3: Verify with backend and get JWT tokens
      final authService = ref.read(authServiceProvider);
      final result = await authService.verifyGoogleToken(idToken, role: role);

      // Step 4: Store JWT tokens
      await _storeTokens(result['data']['accessToken'], result['data']['refreshToken']);

      // Step 5: Create user object and update state
      final userData = result['data']['user'];
      final user = AppUser.fromJson(userData);
      final isNewUser = result['data']['isNewUser'] as bool;

      state = AsyncData(AuthStateData.authenticated(user, isNewUser: isNewUser));

      return AuthResult.success(user, isNewUser);
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
      final result = await authService.register(fullName: fullName, email: email, password: password, phoneNumber: phoneNumber, role: role);

      // Store tokens
      final tokens = result['data']['tokens'];
      await _storeTokens(tokens['accessToken'], tokens['refreshToken']);

      // Create user object
      final userData = result['data']['user'];
      final user = AppUser.fromJson(userData);
      final isNewUser = result['data']['isNewUser'] as bool;

      state = AsyncData(AuthStateData.authenticated(user, isNewUser: isNewUser));

      return AuthResult.success(user, isNewUser);
    } catch (e) {
      return AuthResult.error(e.toString());
    }
  }

  /// Login with email and password
  Future<AuthResult> login({required String email, required String password}) async {
    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.login(email: email, password: password);

      // Store tokens
      await _storeTokens(result['data']['accessToken'], result['data']['refreshToken']);

      // Create user object
      final userData = result['data']['user'];
      final user = AppUser.fromJson(userData);
      final isNewUser = result['data']['isNewUser'] as bool? ?? false;

      state = AsyncData(AuthStateData.authenticated(user, isNewUser: isNewUser));

      return AuthResult.success(user, isNewUser);
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

      // Update access token only
      await storage.write(key: 'access_token', value: result['data']['accessToken']);

      return true;
    } catch (e) {
      // If refresh fails, logout user
      await logout();
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      final storage = ref.read(secureStorageProvider);
      final accessToken = await storage.read(key: 'access_token');

      if (accessToken != null) {
        // Call backend logout
        final authService = ref.read(authServiceProvider);
        await authService.logout(accessToken);
      }
    } catch (e) {
      // Continue with local logout even if API call fails
    } finally {
      // Clear tokens and state
      await _clearTokens();

      // Sign out from Google if signed in
      try {
        final googleAuth = ref.read(googleAuthProvider.notifier);
        await googleAuth.signOut();
      } catch (e) {
        // Ignore Google sign-out errors
      }

      state = const AsyncData(AuthStateData.unauthenticated());
    }
  }

  /// Store tokens in secure storage
  Future<void> _storeTokens(String accessToken, String refreshToken) async {
    final storage = ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: accessToken);
    await storage.write(key: 'refresh_token', value: refreshToken);
  }

  /// Clear all tokens
  Future<void> _clearTokens() async {
    final storage = ref.read(secureStorageProvider);
    await storage.deleteAll();
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
  const Authenticated(this.user, {this.isNewUser = false});
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
