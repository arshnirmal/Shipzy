import '../models/user.dart';

abstract class AuthRepository {
  Future<AppUser> signInWithPhone(String phoneNumber);
  Future<AppUser> verifyOtp(String verificationId, String otp);
  Future<void> signOut();
  Stream<AppUser?> get authStateChanges;
  AppUser? get currentUser;
}
