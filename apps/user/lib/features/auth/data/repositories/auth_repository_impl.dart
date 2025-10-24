import 'package:firebase_auth/firebase_auth.dart';

import '../../domain/models/user.dart';
import '../../domain/repositories/auth_repository.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._firebaseAuth);
  final FirebaseAuth _firebaseAuth;

  @override
  Future<AppUser> signInWithPhone(String phoneNumber) async {
    // For demo purposes, we'll simulate the auth flow
    // In a real implementation, you'd integrate with Firebase Auth properly
    await _firebaseAuth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) async {
        // Auto-retrieval or instant verification
        await _firebaseAuth.signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        throw Exception('Phone verification failed: ${e.message}');
      },
      codeSent: (String verificationId, int? resendToken) {
        // Save verification ID for later use
        // This would be stored in the provider state
      },
      codeAutoRetrievalTimeout: (String verificationId) {
        // Handle timeout
      },
    );

    // Return a mock user for now
    return AppUser(userUuid: 'mock-user-id', phoneNumber: phoneNumber, fullName: '');
  }

  @override
  Future<AppUser> verifyOtp(String verificationId, String otp) async {
    try {
      final credential = PhoneAuthProvider.credential(verificationId: verificationId, smsCode: otp);

      final userCredential = await _firebaseAuth.signInWithCredential(credential);
      final firebaseUser = userCredential.user;

      if (firebaseUser == null) {
        throw Exception('Failed to sign in');
      }

      // Here you would typically call your backend API to get the complete user profile
      // For now, we'll create a basic user
      return AppUser(userUuid: firebaseUser.uid, phoneNumber: firebaseUser.phoneNumber ?? '', fullName: '');
    } catch (e) {
      throw Exception('OTP verification failed: $e');
    }
  }

  @override
  Future<void> signOut() async {
    await _firebaseAuth.signOut();
  }

  @override
  Stream<AppUser?> get authStateChanges => _firebaseAuth.authStateChanges().map((User? firebaseUser) {
    if (firebaseUser == null) return null;

    return AppUser(userUuid: firebaseUser.uid, phoneNumber: firebaseUser.phoneNumber ?? '', fullName: '');
  });

  @override
  AppUser? get currentUser {
    final firebaseUser = _firebaseAuth.currentUser;
    if (firebaseUser == null) return null;

    return AppUser(userUuid: firebaseUser.uid, phoneNumber: firebaseUser.phoneNumber ?? '', fullName: '');
  }
}
