import 'package:flutter/material.dart';

/// Canonical color, gradient, and shadow values for this app shell.
///
/// Sources: [Design-System-Light.md](../../docs/Design-System-Light.md),
/// [Design-System-Dark.md](../../docs/Design-System-Dark.md).
abstract final class AppPalette {
  AppPalette._();

  // --- Light (Urban Navigator) ---

  static const Color lightPrimary = Color(0xFF4648D4);
  static const Color lightPrimaryContainer = Color(0xFF6063EE);
  static const Color lightOnPrimary = Colors.white;
  static const Color lightOnPrimaryContainer = Color(0xFF06008F);

  static const Color lightSurface = Color(0xFFFCF8FF);
  static const Color lightSurfaceContainerLowest = Color(0xFFF8F5FF);
  static const Color lightSurfaceContainerLow = Color(0xFFF5F2FE);
  static const Color lightSurfaceContainer = Color(0xFFEFECF6);
  static const Color lightSurfaceContainerHigh = Color(0xFFE9E6F0);
  static const Color lightSurfaceContainerHighest = Color(0xFFE4E1ED);
  static const Color lightOnSurface = Color(0xFF1B1B23);
  static const Color lightOnSurfaceVariant = Color(0xFF47464F);
  static const Color lightOutlineVariant = Color(0xFFC9C5D0);

  static const Color lightTertiary = Color(0xFF006C49);
  static const Color lightTertiaryContainer = Color(0xFF89F8C7);
  static const Color lightOnTertiary = Colors.white;
  static const Color lightOnTertiaryContainer = Color(0xFF002115);

  static const Color lightError = Color(0xFFBA1A1A);
  static const Color lightErrorContainer = Color(0xFFFFDAD6);
  static const Color lightOnErrorContainer = Color(0xFF410002);

  // --- Dark (Night Navigator) ---

  static const Color darkPrimary = Color(0xFFC0C1FF);
  static const Color darkPrimaryContainer = Color(0xFF8083FF);
  static const Color darkOnPrimary = Color(0xFF0D0FAA);
  static const Color darkOnPrimaryContainer = Color(0xFF1A1C82);

  static const Color darkSurface = Color(0xFF131313);
  static const Color darkSurfaceContainerLowest = Color(0xFF0E0E0E);
  static const Color darkSurfaceContainerLow = Color(0xFF1C1B1B);
  static const Color darkSurfaceContainer = Color(0xFF242422);
  static const Color darkSurfaceContainerHigh = Color(0xFF2E2D2C);
  static const Color darkSurfaceContainerHighest = Color(0xFF353534);
  static const Color darkOnSurface = Color(0xFFE5E2E1);
  static const Color darkOnSurfaceVariant = Color(0xFFC9C6C4);
  static const Color darkOutlineVariant = Color(0xFF47464E);

  static const Color darkTertiary = Color(0xFF6DDBAB);
  static const Color darkTertiaryContainer = Color(0xFF005138);
  static const Color darkOnTertiary = Color(0xFF003825);
  static const Color darkOnTertiaryContainer = Color(0xFF89F8C7);

  static const Color darkError = Color(0xFFFFB4AB);
  static const Color darkErrorContainer = Color(0xFF93000A);
  static const Color darkOnErrorContainer = Color(0xFFFFDAD6);

  // --- Status (glance UI; not ColorScheme roles) ---

  static const Color onlineLight = lightTertiary;
  static const Color onlineDark = darkTertiary;
  static const Color onlineBgLight = lightTertiaryContainer;
  static const Color onlineBgDark = darkTertiaryContainer;

  static const Color busyLight = Color(0xFFE65100);
  static const Color busyDark = Color(0xFFFFB74D);

  static const Color offlineLight = lightOnSurfaceVariant;
  static const Color offlineDark = darkOnSurfaceVariant;

  static const Color pausedLight = Color(0xFFF57C00);
  static const Color pausedDark = Color(0xFFFFCC02);

  static const Color earningsPositiveLight = lightTertiary;
  static const Color earningsPositiveDark = darkTertiary;

  static const Color pendingPayoutLight = Color(0xFFE65100);
  static const Color pendingPayoutDark = Color(0xFFFFB74D);

  /// Design system: map overlays — keep content off screen edges.
  static const double overlayBreathingMargin = 16;

  /// Light: 135° primary → primary_container (“liquid light” CTA).
  static const LinearGradient primaryGradientLight = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [lightPrimary, lightPrimaryContainer],
  );

  static const LinearGradient primaryGradientDark = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [darkPrimary, darkPrimaryContainer],
  );

  /// Light: primary-tinted ambient, 6% opacity, 16px blur (Design-System-Light §4).
  static const BoxShadow ambientShadowLight = BoxShadow(
    color: Color.fromRGBO(70, 72, 212, 0.06),
    blurRadius: 16,
    offset: Offset(0, 4),
  );

  /// Dark: ambient occlusion (Design-System-Dark §4).
  static const BoxShadow ambientShadowDark = BoxShadow(
    color: Color.fromRGBO(0, 0, 0, 0.40),
    blurRadius: 48,
    spreadRadius: -24,
    offset: Offset(0, 24),
  );

  static const double glassmorphismOpacityLight = 0.85;
  static const double glassmorphismBlurLight = 24;

  static const double glassmorphismOpacityDark = 0.60;
  static const double glassmorphismBlurDark = 20;
}
