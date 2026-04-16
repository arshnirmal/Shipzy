import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/auth_provider.dart';
import '../providers/storage_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/delivery/active_delivery_screen.dart';
import '../screens/earnings/earnings_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/orders/orders_list_screen.dart';
import '../screens/profile/document_upload_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/profile/setup_profile_screen.dart';
import '../screens/splash_screen.dart';
import 'app_routes.dart';

part 'app_router.g.dart';

const String _kHasSeenOnboardingKey = 'has_seen_onboarding';

final FutureProvider<bool> onboardingSeenProvider = FutureProvider<bool>((Ref ref) async {
  final sharedPreferences = await ref.watch(sharedPreferencesProvider.future);
  return sharedPreferences.getBool(_kHasSeenOnboardingKey) ?? false;
});

@riverpod
GoRouter router(Ref ref) {
  final authState = ref.watch(authProvider);
  final onboardingSeenState = ref.watch(onboardingSeenProvider);

  return GoRouter(
    debugLogDiagnostics: true,
    initialLocation: AppRoutes.splash,

    redirect: (context, state) {
      final location = state.matchedLocation;

      if (authState.valueOrNull == null || onboardingSeenState.valueOrNull == null) {
        return location == AppRoutes.splash ? null : AppRoutes.splash;
      }

      final hasSeenOnboarding = onboardingSeenState.value ?? false;
      final isOnboardingRoute = location == AppRoutes.onboarding;

      if (!hasSeenOnboarding) {
        return isOnboardingRoute ? null : AppRoutes.onboarding;
      }

      final authData = authState.value!;
      final isAuthenticated = authData is Authenticated;
      final isNewUser = authData is Authenticated && authData.isNewUser;

      final isOnSplash = location == AppRoutes.splash;
      final isAuthRoute = location == AppRoutes.login || location == AppRoutes.register;
      final isProfileOnboardingRoute = location == AppRoutes.setupProfile || location == AppRoutes.documentUpload;
      final isMainRoute =
          location == AppRoutes.home || location == AppRoutes.orders || location == AppRoutes.earnings || location == AppRoutes.profile;

      if (isOnboardingRoute) {
        if (!isAuthenticated) {
          return AppRoutes.login;
        }
        return isNewUser ? AppRoutes.setupProfile : AppRoutes.home;
      }

      if (!isAuthenticated) {
        if (isMainRoute || isProfileOnboardingRoute || isOnSplash) {
          return AppRoutes.login;
        }
        return null;
      }

      if (isNewUser) {
        return isProfileOnboardingRoute ? null : AppRoutes.setupProfile;
      }

      if (isAuthRoute || isOnSplash || isProfileOnboardingRoute) {
        return AppRoutes.home;
      }

      return null;
    },
    routes: [
      // ============ SPLASH ============
      GoRoute(path: AppRoutes.splash, name: 'splash', builder: (context, state) => const SplashScreen()),

      // ============ AUTHENTICATION ============
      GoRoute(path: AppRoutes.login, name: 'login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: AppRoutes.register, name: 'register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: AppRoutes.onboarding, name: 'onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: AppRoutes.setupProfile, name: 'setupProfile', builder: (context, state) => const SetupProfileScreen()),
      GoRoute(path: AppRoutes.documentUpload, name: 'documentUpload', builder: (context, state) => const DocumentUploadScreen()),
      GoRoute(
        path: AppRoutes.activeDelivery,
        name: 'activeDelivery',
        builder: (context, state) => ActiveDeliveryScreen(orderId: state.pathParameters['orderId']!),
      ),
      // ============ MAIN APP (Shell Route for Bottom Nav) ============
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => DashboardScreen(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: AppRoutes.home, name: 'home', builder: (context, state) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: AppRoutes.orders, name: 'orders', builder: (context, state) => const OrdersListScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: AppRoutes.earnings, name: 'earnings', builder: (context, state) => const EarningsScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: AppRoutes.profile, name: 'profile', builder: (context, state) => const ProfileScreen())],
          ),
        ],
      ),
    ],
  );
}
