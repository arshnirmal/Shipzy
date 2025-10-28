/// Defines all the route paths used in the Shipzy application.
///
/// This class contains static constants for all route paths to ensure consistency
/// across the application and avoid typos in route navigation.
class AppRoutes {
  /// Private constructor to prevent instantiation.
  AppRoutes._();

  // ============ AUTH ROUTES ============
  /// Route for the splash screen.
  static const String splash = '/';

  /// Route for phone number authentication.
  static const String phoneAuth = '/phone-auth';

  /// Route for OTP verification.
  static const String otp = '/otp';

  /// Route for profile creation (first-time users).
  static const String createProfile = '/create-profile';

  // ============ MAIN APP ROUTES ============
  /// Route for the home screen.
  static const String home = '/home';

  /// Route for the orders list screen.
  static const String orderList = '/orders';

  /// Route for the user profile screen.
  static const String profile = '/profile';

  // ============ ORDER ROUTES ============
  /// Route for creating a new order.
  static const String createOrder = '/create-order';

  /// Route for viewing order details.
  static const String orderDetails = '/order-details';

  /// Route for tracking order status.
  static const String orderTracking = '/order-tracking';

  // ============ ADDRESS ROUTES ============
  /// Route for the address list screen.
  static const String addressList = '/addresses';

  /// Route for adding/editing addresses.
  static const String addressForm = '/address-form';

  // ============ PAYMENT ROUTES ============
  /// Route for payment processing.
  static const String payment = '/payment';
}
