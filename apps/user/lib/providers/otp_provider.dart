import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'auth_state_provider.dart';
import 'phone_auth_provider.dart';

part 'otp_provider.g.dart';

@riverpod
class OtpVerification extends _$OtpVerification {
  Timer? _resendTimer;
  int _resendCountdown = 0;

  @override
  OtpState build() => const OtpState.initial();

  void updateOtp(String otp) {
    state = state.copyWith(otp: otp);
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void setError(String? error) {
    state = state.copyWith(error: error, isLoading: false);
  }

  void startResendTimer() {
    _resendCountdown = 60;
    state = state.copyWith(resendCountdown: _resendCountdown);

    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      _resendCountdown--;
      state = state.copyWith(resendCountdown: _resendCountdown);

      if (_resendCountdown <= 0) {
        timer.cancel();
      }
    });
  }

  Future<void> verifyOtp() async {
    if (state.otp.length != 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      final phoneAuthNotifier = ref.read(phoneAuthenticationProvider.notifier);
      final credential = await phoneAuthNotifier.verifyOtp(state.otp);

      if (credential == null) {
        setError('Invalid OTP. Please try again.');
        return;
      }

      // Sign in with Firebase
      final userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      final idToken = await userCredential.user?.getIdToken();

      if (idToken == null) {
        setError('Failed to authenticate. Please try again.');
        return;
      }

      // Complete authentication with backend
      final authNotifier = ref.read(authStateProvider.notifier);
      final result = await authNotifier.completeAuthentication(idToken);

      result.when(
        success: (user, isNewUser) {
          state = state.copyWith(isLoading: false, isSuccess: true);
          // Navigation will be handled by the auth state listener in the router
        },
        error: (message) {
          setError(message);
        },
      );
    } catch (e) {
      setError('Verification failed: $e');
    }
  }

  Future<void> resendOtp() async {
    if (_resendCountdown > 0) return;

    setError(null);
    final phoneAuthNotifier = ref.read(phoneAuthenticationProvider.notifier);
    await phoneAuthNotifier.sendOtp();
    startResendTimer();
  }

  void dispose() {
    _resendTimer?.cancel();
  }
}

class OtpState {
  const OtpState({required this.otp, required this.isLoading, required this.error, required this.resendCountdown, required this.isSuccess});

  const OtpState.initial() : otp = '', isLoading = false, error = null, resendCountdown = 0, isSuccess = false;

  final String otp;
  final bool isLoading;
  final String? error;
  final int resendCountdown;
  final bool isSuccess;

  bool get canVerify => !isLoading && otp.length == 6 && error == null;
  bool get canResend => resendCountdown <= 0 && !isLoading;

  OtpState copyWith({String? otp, bool? isLoading, String? error, int? resendCountdown, bool? isSuccess}) => OtpState(
    otp: otp ?? this.otp,
    isLoading: isLoading ?? this.isLoading,
    error: error ?? this.error,
    resendCountdown: resendCountdown ?? this.resendCountdown,
    isSuccess: isSuccess ?? this.isSuccess,
  );
}
