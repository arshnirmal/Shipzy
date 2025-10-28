import 'package:firebase_auth/firebase_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/user.dart';
import 'auth_service_provider.dart';
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

  /// Complete authentication by verifying with backend and storing tokens
  Future<AuthResult> completeAuthentication(String idToken, {String? fullName, String? email}) async {
    try {
      final authService = ref.read(authServiceProvider);
      final result = await authService.verifyWithBackend(idToken, fullName: fullName, email: email);

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
