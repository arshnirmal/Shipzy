import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/auth_state_provider.dart';
import '../screens/auth/create_profile_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/new_order/address_form_screen.dart';
import '../screens/new_order/address_list_screen.dart';
import '../screens/new_order/create_order_screen.dart';
import '../screens/new_order/payment_screen.dart';
import '../screens/orders/order_details_screen.dart';
import '../screens/orders/order_list_screen.dart';
import '../screens/orders/order_tracking_screen.dart';
import '../screens/profile/profile_screen.dart';
import '../screens/splash_screen.dart';
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

      final isAuthRoute = state.matchedLocation == AppRoutes.login || state.matchedLocation == AppRoutes.register;
      final isOnSplash = state.matchedLocation == AppRoutes.splash;

      // Handle splash screen redirects
      if (isOnSplash) {
        return authStateValue.maybeWhen(
          data: (authData) => authData.maybeWhen(
            authenticated: (user, isNewUser) => isNewUser ? AppRoutes.createProfile : AppRoutes.home,
            unauthenticated: () => AppRoutes.login,
            orElse: () => AppRoutes.login, // Default to login if unknown state
          ),
          orElse: () => null, // Stay on splash while loading
        );
      }

      // If auth state is still loading, don't redirect
      final authResult = authStateValue.maybeWhen(
        data: (authData) => authData.maybeWhen(
          authenticated: (user, isNewUser) => isNewUser ? 'new_user' : 'authenticated',
          unauthenticated: () => 'unauthenticated',
          orElse: () => 'unknown',
        ),
        orElse: () => null, // Loading state
      );

      if (authResult == null) {
        return null; // Stay on current route while loading
      }

      final isAuthenticated = authResult == 'authenticated' || authResult == 'new_user';
      final isNewUser = authResult == 'new_user';

      // If not authenticated and not on auth route, redirect to phone auth
      if (!isAuthenticated && !isAuthRoute && state.matchedLocation != AppRoutes.createProfile) {
        return AppRoutes.login;
      }

      // If authenticated and on auth route, redirect based on user status
      if (isAuthenticated && isAuthRoute) {
        return isNewUser ? AppRoutes.createProfile : AppRoutes.home;
      }

      // If new user and not on create profile, redirect to create profile
      if (isNewUser && state.matchedLocation != AppRoutes.createProfile && !isAuthRoute && state.matchedLocation != AppRoutes.splash) {
        return AppRoutes.createProfile;
      }

      return null;
    },

    routes: [
      // ============ SPLASH ============
      GoRoute(path: AppRoutes.splash, name: 'splash', builder: (context, state) => const SplashScreen()),

      // ============ AUTHENTICATION ============
      GoRoute(path: AppRoutes.login, name: 'login', builder: (context, state) => const LoginScreen()),
      GoRoute(path: AppRoutes.register, name: 'register', builder: (context, state) => const RegisterScreen()),
      GoRoute(path: AppRoutes.createProfile, name: 'createProfile', builder: (context, state) => const CreateProfileScreen()),

      // ============ MAIN APP (Shell Route for Bottom Nav) ============
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: AppRoutes.home, name: 'home', builder: (context, state) => const HomeScreen()),
          GoRoute(path: AppRoutes.orderList, name: 'orderList', builder: (context, state) => const OrderListScreen()),
          GoRoute(path: AppRoutes.profile, name: 'profile', builder: (context, state) => const ProfileScreen()),
        ],
      ),

      // ============ ORDER FLOW ============
      GoRoute(
        path: AppRoutes.createOrder,
        name: 'createOrder',
        pageBuilder: (context, state) => const CustomTransitionPage(child: CreateOrderScreen(), transitionsBuilder: _slideTransition),
      ),
      GoRoute(
        path: '${AppRoutes.orderDetails}/:orderId',
        name: 'orderDetails',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return OrderDetailsScreen(orderId: orderId);
        },
      ),
      GoRoute(
        path: '${AppRoutes.orderTracking}/:orderId',
        name: 'orderTracking',
        builder: (context, state) {
          final orderId = state.pathParameters['orderId']!;
          return OrderTrackingScreen(orderId: orderId);
        },
      ),

      // ============ ADDRESS ============
      GoRoute(path: AppRoutes.addressList, name: 'addressList', builder: (context, state) => const AddressListScreen()),
      GoRoute(
        path: AppRoutes.addressForm,
        name: 'addressForm',
        builder: (context, state) {
          final addressId = state.uri.queryParameters['id'];
          return AddressFormScreen(addressId: addressId);
        },
      ),

      // ============ PAYMENT ============
      GoRoute(
        path: AppRoutes.payment,
        name: 'payment',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return PaymentScreen(orderId: extra?['orderId'] as String, amount: extra?['amount'] as double);
        },
      ),
    ],

    // Error handling
    errorBuilder: (context, state) => ErrorScreen(error: state.error),
  );
}

// Custom slide transition
Widget _slideTransition(BuildContext context, Animation<double> animation, Animation<double> secondaryAnimation, Widget child) => SlideTransition(
  position: animation.drive(Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero).chain(CurveTween(curve: Curves.easeInOut))),
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
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Error: ${error.toString()}')));
}

// TODO: Create these widgets
class AppBottomNavBar extends StatelessWidget {
  const AppBottomNavBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(); // Placeholder
  }
}
