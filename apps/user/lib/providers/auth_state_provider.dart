import 'package:firebase_auth/firebase_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/user.dart';
import 'storage_provider.dart';

part 'auth_state_provider.g.dart';

@riverpod
class AuthState extends _$AuthState {
  @override
  Stream<AuthStateData> build() {
    // Listen to Firebase auth state changes
    return FirebaseAuth.instance.authStateChanges().asyncMap((firebaseUser) async {
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

      return AuthStateData.authenticated(user);
    });
  }

  Future<AppUser> _fetchUserProfile(String uid) async {
    // TODO: Implement API call to fetch user profile
    return AppUser(userUuid: uid, phoneNumber: FirebaseAuth.instance.currentUser?.phoneNumber ?? '', fullName: '');
  }

  Future<void> signOut() async {
    await FirebaseAuth.instance.signOut();
    final storage = ref.read(secureStorageProvider);
    await storage.deleteAll();
  }
}

// Auth state sealed class
sealed class AuthStateData {
  const AuthStateData();

  const factory AuthStateData.authenticated(AppUser user) = Authenticated;
  const factory AuthStateData.unauthenticated() = Unauthenticated;

  T when<T>({required T Function(AppUser user) authenticated, required T Function() unauthenticated}) {
    final state = this;
    if (state is Authenticated) {
      return authenticated(state.user);
    } else {
      return unauthenticated();
    }
  }

  T maybeWhen<T>({required T Function() orElse, T Function(AppUser user)? authenticated, T Function()? unauthenticated}) {
    final state = this;
    if (state is Authenticated && authenticated != null) {
      return authenticated(state.user);
    } else if (state is Unauthenticated && unauthenticated != null) {
      return unauthenticated();
    }
    return orElse();
  }
}

class Authenticated extends AuthStateData {
  const Authenticated(this.user);
  final AppUser user;
}

class Unauthenticated extends AuthStateData {
  const Unauthenticated();
}
