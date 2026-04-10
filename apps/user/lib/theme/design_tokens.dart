import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF6366F1);
  static const Color primaryGradientStart = Color(0xFF6366F1);
  static const Color primaryGradientEnd = Color(0xFF8083FF);

  static const Color lightOnSurface = Color(0xFF0B1C30);
  static const Color darkOnSurface = Color(0xFFF1F5F9);

  static const Color lightSurfaceLowest = Color(0xFFFFFFFF);
  static const Color lightSurfaceLow = Color(0xFFEFF4FF);
  static const Color lightSurfaceHigh = Color(0xFFDCE9FF);

  static const Color darkSurfaceLowest = Color(0xFF121212);
  static const Color darkSurfaceLow = Color(0xFF1E1E1E);
  static const Color darkSurfaceHigh = Color(0xFF252525);

  static const Color lightOnSurfaceVariant = Color(0xFF5F6E82);
  static const Color darkOnSurfaceVariant = Color(0xFF94A3B8);

  static const Color lightOutlineVariant = Color(0xFFE2E8F0);
  static const Color darkOutlineVariant = Color(0xFF334155);
  static const Color tertiaryContainer = Color(0xFFFCE2A6);

  static const Color error = Color(0xFFD32F2F);

  /// Labels and icons on gradient primary CTAs (contrast on indigo gradient).
  static const Color onPrimaryCta = Color(0xFFFFFFFF);
}

class AppSpacing {
  AppSpacing._();

  static const double xxs = 4;
  static const double xs = 8;
  static const double sm = 12;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double xxl = 48;
}

class AppRadius {
  AppRadius._();

  static const double lg = 8;
  static const double xl = 16;
  static const double onboardingHero = 24;

  static BorderRadius get radiusLg => BorderRadius.circular(lg);
  static BorderRadius get radiusXl => BorderRadius.circular(xl);
  static BorderRadius get radiusOnboardingHero => BorderRadius.circular(onboardingHero);
}

class AppDepth {
  AppDepth._();

  static const double glassOpacity = 0.8;
  static const double ghostBorderOpacity = 0.15;
  static const double inputBorderOpacity = 0.2;

  static List<BoxShadow> ambientShadow(Brightness brightness) => [
    BoxShadow(
      color: (brightness == Brightness.dark ? Colors.black : const Color(0xFF6366F1)).withValues(
        alpha: brightness == Brightness.dark ? 0.3 : 0.08,
      ),
      blurRadius: 24,
      offset: const Offset(0, 8),
    ),
  ];
}

class AppGradients {
  AppGradients._();

  static const LinearGradient primaryCta = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [AppColors.primaryGradientStart, AppColors.primaryGradientEnd],
  );
}
