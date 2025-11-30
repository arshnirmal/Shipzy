import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shipzy_driver/providers/auth_provider.dart';
import 'package:shipzy_driver/screens/auth/login_screen.dart';
import 'package:shipzy_driver/screens/auth/register_screen.dart';
import 'package:shipzy_driver/screens/dashboard/dashboard_screen.dart';
import 'package:shipzy_driver/screens/delivery/active_delivery_screen.dart';
import 'package:shipzy_driver/screens/earnings/earnings_screen.dart';
import 'package:shipzy_driver/screens/home/home_screen.dart';
import 'package:shipzy_driver/screens/onboarding/onboarding_screen.dart';
import 'package:shipzy_driver/screens/orders/order_details_screen.dart';
import 'package:shipzy_driver/screens/orders/orders_list_screen.dart';
import 'package:shipzy_driver/screens/profile/document_upload_screen.dart';
import 'package:shipzy_driver/screens/profile/profile_screen.dart';
import 'package:shipzy_driver/screens/profile/setup_profile_screen.dart';

part 'app_router.g.dart';

@riverpod
GoRouter router(Ref ref) {
  return GoRouter(
    initialLocation: '/login', // Changed initialLocation
    redirect: (context, state) {
      final authState = ref.watch(authProvider);

      return authState.when(
        data: (auth) {
          return auth.maybeWhen(
            authenticated: (user, {required isNewUser}) {
              // User is authenticated
              if (state.matchedLocation == '/login' || state.matchedLocation == '/register') {
                return '/home'; // Redirect to home if trying to access auth screens
              }
              return null; // Allow access
            },
            unauthenticated: () {
              // User is not authenticated
              if (state.matchedLocation != '/login' && state.matchedLocation != '/register') {
                return '/login'; // Redirect to login if trying to access protected screens
              }
              return null; // Allow access
            },
            orElse: () => null,
          );
        },
        loading: () => null, // Wait while loading
        error: (_, __) => '/login', // Redirect to login on error
      );
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: '/register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: '/onboarding', builder: (context, state) => const OnboardingScreen()),
      GoRoute(path: '/setup-profile', builder: (context, state) => const SetupProfileScreen()),
      GoRoute(path: '/document-upload', builder: (context, state) => const DocumentUploadScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return DashboardScreen(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [GoRoute(path: '/home', builder: (context, state) => const HomeScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/orders', builder: (context, state) => const OrdersListScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/earnings', builder: (context, state) => const EarningsScreen())],
          ),
          StatefulShellBranch(
            routes: [GoRoute(path: '/profile', builder: (context, state) => const ProfileScreen())],
          ),
        ],
      ),
      GoRoute(
        path: '/order-details/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return OrderDetailsScreen(orderId: id);
        },
      ),
      GoRoute(
        path: '/active-delivery/:id',
        builder: (context, state) {
          final id = state.pathParameters['id']!;
          return ActiveDeliveryScreen(orderId: id);
        },
      ),
    ],
  );
}
