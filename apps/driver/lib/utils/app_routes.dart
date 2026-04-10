/// Defines all the route paths used in the Shipzy Driver application.
///
/// This class contains static constants for all route paths to ensure consistency
/// across the application and avoid typos in route navigation.
class AppRoutes {
  /// Private constructor to prevent instantiation.
  AppRoutes._();

  // ============ AUTH ROUTES ============

  /// Route for the splash screen.
  static const String splash = '/';

  /// Route for email/password login.
  static const String login = '/login';

  /// Route for account registration.
  static const String register = '/register';

  /// Route for onboarding new drivers.
  static const String onboarding = '/onboarding';

  /// Route for profile setup.
  static const String setupProfile = '/setup-profile';

  /// Route for document upload.
  static const String documentUpload = '/document-upload';

  // ============ MAIN APP ROUTES ============

  /// Route for the home screen.
  static const String home = '/home';

  /// Route for the orders list screen.
  static const String orders = '/orders';

  /// Route for the earnings screen.
  static const String earnings = '/earnings';

  /// Route for the profile screen.
  static const String profile = '/profile';
}
