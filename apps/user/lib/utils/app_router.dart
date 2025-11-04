// lib/routing/app_router.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/auth_state_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/placeholder/create_order_screen.dart';
import '../screens/placeholder/order_details_screen.dart';
import '../screens/placeholder/orders_list_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/splash_screen.dart';
import '../widgets/navigation/app_bottom_nav_bar.dart';
import 'app_routes.dart';

part 'app_router.g.dart';

@riverpod
GoRouter router(Ref ref) {
  final authState = ref.watch(authStateProvider);

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
            authenticated: (user, {required bool isNewUser}) => AppRoutes.home,
            unauthenticated: () => AppRoutes.login,
            orElse: () => AppRoutes.login,
          ),
          orElse: () => null, // Stay on splash while loading
        );
      }

      // If auth state is still loading, don't redirect
      final authResult = authStateValue.maybeWhen(
        data: (authData) => authData.maybeWhen(
          authenticated: (user, {required bool isNewUser}) => isNewUser ? 'new_user' : 'authenticated',
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

      // ============ MAIN APP (Shell Route for Bottom Nav) ============
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: AppRoutes.home,
            name: 'home',
            pageBuilder: (context, state) => const NoTransitionPage(child: HomeScreen()),
          ),
          GoRoute(
            path: AppRoutes.orderList,
            name: 'orderList',
            pageBuilder: (context, state) => const NoTransitionPage(child: OrdersListScreen()),
          ),
          GoRoute(
            path: AppRoutes.profile,
            name: 'profile',
            pageBuilder: (context, state) => const NoTransitionPage(child: ProfileScreen()),
          ),
        ],
      ),

      // ============ ORDER FLOW ============
      GoRoute(
        path: AppRoutes.createOrder,
        name: 'createOrder',
        pageBuilder: (context, state) => const CustomTransitionPage(child: CreateOrderScreen(), transitionsBuilder: _slideTransition),
      ),

      GoRoute(
        path: AppRoutes.orderDetailsPath,
        name: 'orderDetails',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return OrderDetailsScreen(orderId: orderId);
        },
      ),

      // ============ ADDRESS ============
      GoRoute(
        path: AppRoutes.addressList,
        name: 'addressList',
        builder: (context, state) => const Scaffold(body: Center(child: Text('Address List - Coming Soon'))),
      ),

      GoRoute(
        path: AppRoutes.addressForm,
        name: 'addressForm',
        builder: (context, state) {
          final addressId = state.uri.queryParameters['id'];
          return Scaffold(body: Center(child: Text('Address Form - ${addressId ?? 'New'}')));
        },
      ),

      // ============ PAYMENT ============
      GoRoute(
        path: AppRoutes.payment,
        name: 'payment',
        builder: (context, state) {
          final extra = state.extra as Map?;
          return Scaffold(body: Center(child: Text('Payment - Order: ${extra?['orderId'] ?? 'N/A'}')));
        },
      ),
    ],

    // Error handling
    errorBuilder: (context, state) => ErrorScreen(error: state.error),
  );
}

// Custom slide transition
Widget _slideTransition(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) => SlideTransition(
  position: animation.drive(Tween(begin: const Offset(1, 0), end: Offset.zero).chain(CurveTween(curve: Curves.easeInOut))),
  child: child,
);

// Main shell with bottom navigation
class MainShell extends StatelessWidget {
  const MainShell({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) => Scaffold(body: child, bottomNavigationBar: const AppBottomNavBar());
}

// Error screen
class ErrorScreen extends StatelessWidget {
  const ErrorScreen({this.error, super.key});

  final Exception? error;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
              const SizedBox(height: 16),
              Text('Oops! Something went wrong', style: theme.textTheme.titleLarge, textAlign: TextAlign.center),
              const SizedBox(height: 8),
              Text(
                error?.toString() ?? 'Unknown error occurred',
                style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton.icon(onPressed: () => context.go(AppRoutes.home), icon: const Icon(Icons.home), label: const Text('Go Home')),
            ],
          ),
        ),
      ),
    );
  }
}
