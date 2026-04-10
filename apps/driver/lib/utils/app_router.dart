import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
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

@riverpod
GoRouter router(Ref ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    debugLogDiagnostics: true,
    initialLocation: AppRoutes.splash,

    // Redirect logic based on auth state
    redirect: (context, state) {
      final authStateValue = authState;
      final isOnSplash = state.matchedLocation == AppRoutes.splash;

      // Handle splash screen redirects
      if (isOnSplash) {
        return authStateValue.maybeWhen(
          data: (authData) => authData.maybeWhen(
            authenticated: (user, {required isNewUser}) => AppRoutes.home,
            unauthenticated: () => AppRoutes.login,
            orElse: () => AppRoutes.login,
          ),
          orElse: () => null, // Stay on splash while loading
        );
      }

      // If auth state is still loading, don't redirect
      final authResult = authStateValue.maybeWhen(
        data: (authData) => authData.maybeWhen(
          authenticated: (user, {required isNewUser}) => isNewUser ? AppRoutes.setupProfile : 'authenticated',
          unauthenticated: () => 'unauthenticated',
          orElse: () => 'unknown',
        ),
        orElse: () => null, // Loading state
      );

      if (authResult == null) {
        return null; // Stay on current route while loading
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
