import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'auth_service_provider.dart';

part 'profile_provider.g.dart';

@riverpod
class Profile extends _$Profile {
  @override
  ProfileState build() => const ProfileState();

  Future<bool> updateProfile({required String fullName, String? email}) async {
    state = state.copyWith(isLoading: true);

    try {
      final authService = ref.read(authServiceProvider);

      // For now, we'll just simulate the profile update
      // In a real implementation, you'd call the backend API
      await Future.delayed(const Duration(seconds: 1)); // Simulate API call

      // Update local user state (you might want to refresh from backend)
      // For now, we'll just mark as success

      state = state.copyWith(isLoading: false, isSuccess: true);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }
}

class ProfileState {
  const ProfileState({this.isLoading = false, this.error, this.isSuccess = false});

  final bool isLoading;
  final String? error;
  final bool isSuccess;

  ProfileState copyWith({bool? isLoading, String? error, bool? isSuccess}) =>
      ProfileState(isLoading: isLoading ?? this.isLoading, error: error ?? this.error, isSuccess: isSuccess ?? this.isSuccess);
}
