import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/theme_provider.dart';
import 'theme/app_theme.dart';
import 'utils/app_router.dart';

/// The main application widget that sets up the app's theme, routing, and providers.
///
/// This widget is the root of the Shipzy application and handles:
/// - Theme configuration (light/dark mode)
/// - Routing with GoRouter
/// - Global text scaling
/// - Provider scope for state management
class ShipzyApp extends ConsumerWidget {
  /// Creates a [ShipzyApp] widget.
  const ShipzyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    /// Builds the main application widget with MaterialApp.router configuration.
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      // App Info
      title: 'Shipzy',
      debugShowCheckedModeBanner: false,

      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,

      // Routing with GoRouter
      routerConfig: router,

      // Builder for global wrappers
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
        child: child!,
      ),
    );
  }
}
