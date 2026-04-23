import 'driver_profile.dart';
import 'user.dart';

extension DriverProfileToAppUser on DriverProfile {
  /// Maps courier `GET /drivers/me` payload to [AppUser] for auth / routing.
  AppUser toAppUser() => AppUser(
    userId: userId,
    userUuid: userUuid,
    fullName: fullName,
    email: email,
    phoneNumber: phoneNumber,
    profilePictureUrl: profilePictureUrl,
    isVerified: isVerified,
    isActive: isActive,
    createdAt: createdAt,
    updatedAt: updatedAt,
  );
}
