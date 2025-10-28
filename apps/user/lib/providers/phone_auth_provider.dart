import 'package:firebase_auth/firebase_auth.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'phone_auth_provider.g.dart';

@riverpod
class PhoneAuthentication extends _$PhoneAuthentication {
  @override
  PhoneAuthState build() => const PhoneAuthState.initial();

  void updatePhoneNumber(String phoneNumber) {
    state = state.copyWith(phoneNumber: phoneNumber);
  }

  void setLoading(bool loading) {
    state = state.copyWith(isLoading: loading);
  }

  void setError(String? error) {
    state = state.copyWith(error: error, isLoading: false);
  }

  void setVerificationId(String verificationId) {
    state = state.copyWith(verificationId: verificationId, isLoading: false);
  }

  Future<void> sendOtp() async {
    if (state.phoneNumber.isEmpty || !state.isValidPhoneNumber) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: '+91${state.phoneNumber}',
        verificationCompleted: (PhoneAuthCredential credential) async {
          // Auto-verification completed
          state = state.copyWith(autoVerifiedCredential: credential, isLoading: false);
        },
        verificationFailed: (FirebaseAuthException e) {
          setError(_mapFirebaseError(e));
        },
        codeSent: (String verificationId, int? resendToken) {
          setVerificationId(verificationId);
          state = state.copyWith(resendToken: resendToken);
        },
        codeAutoRetrievalTimeout: setVerificationId,
        timeout: const Duration(seconds: 60),
      );
    } catch (e) {
      setError('Failed to send OTP: $e');
    }
  }

  Future<PhoneAuthCredential?> verifyOtp(String otp) async {
    if (state.verificationId == null) {
      setError('Verification ID not found. Please try again.');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      final credential = PhoneAuthProvider.credential(verificationId: state.verificationId!, smsCode: otp);

      // If we have auto-verified credential, use that instead
      final finalCredential = state.autoVerifiedCredential ?? credential;

      return finalCredential;
    } catch (e) {
      setError('Invalid OTP. Please try again.');
      return null;
    }
  }

  void reset() {
    state = const PhoneAuthState.initial();
  }

  String _mapFirebaseError(FirebaseAuthException e) {
    switch (e.code) {
      case 'invalid-phone-number':
        return 'Invalid phone number format';
      case 'too-many-requests':
        return 'Too many requests. Please try again later';
      case 'quota-exceeded':
        return 'SMS quota exceeded. Please try again later';
      case 'network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Failed to send OTP: ${e.message}';
    }
  }
}

class PhoneAuthState {
  const PhoneAuthState({
    required this.phoneNumber,
    required this.isLoading,
    required this.error,
    required this.verificationId,
    required this.resendToken,
    required this.autoVerifiedCredential,
  });

  const PhoneAuthState.initial()
    : phoneNumber = '',
      isLoading = false,
      error = null,
      verificationId = null,
      resendToken = null,
      autoVerifiedCredential = null;

  final String phoneNumber;
  final bool isLoading;
  final String? error;
  final String? verificationId;
  final int? resendToken;
  final PhoneAuthCredential? autoVerifiedCredential;

  bool get isValidPhoneNumber => phoneNumber.length == 10 && RegExp(r'^\d{10}$').hasMatch(phoneNumber);

  bool get canSendOtp => !isLoading && isValidPhoneNumber && error == null;

  PhoneAuthState copyWith({
    String? phoneNumber,
    bool? isLoading,
    String? error,
    String? verificationId,
    int? resendToken,
    PhoneAuthCredential? autoVerifiedCredential,
  }) => PhoneAuthState(
    phoneNumber: phoneNumber ?? this.phoneNumber,
    isLoading: isLoading ?? this.isLoading,
    error: error ?? this.error,
    verificationId: verificationId ?? this.verificationId,
    resendToken: resendToken ?? this.resendToken,
    autoVerifiedCredential: autoVerifiedCredential ?? this.autoVerifiedCredential,
  );
}
