import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF6366F1);
  static const Color primaryGradientStart = Color(0xFF4648D4);
  static const Color primaryGradientEnd = Color(0xFF6063EE);

  static const Color lightOnSurface = Color(0xFF0B1C30);
  static const Color darkOnSurface = Color(0xFFF8FAFC);

  static const Color lightSurfaceLowest = Color(0xFFFFFFFF);
  static const Color lightSurfaceLow = Color(0xFFEFF4FF);
  static const Color lightSurfaceHigh = Color(0xFFDCE9FF);

  static const Color darkSurfaceLowest = Color(0xFF111827);
  static const Color darkSurfaceLow = Color(0xFF1B263A);
  static const Color darkSurfaceHigh = Color(0xFF233148);

  static const Color lightOnSurfaceVariant = Color(0xFF5F6E82);
  static const Color darkOnSurfaceVariant = Color(0xFFB8C4D5);

  static const Color outlineVariant = Color(0xFF9AA7BA);
  static const Color tertiaryContainer = Color(0xFFFCE2A6);

  static const Color error = Color(0xFFD32F2F);
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
  static BorderRadius get radiusLg => BorderRadius.circular(lg);
}

class AppDepth {
  AppDepth._();

  static const double glassOpacity = 0.8;
  static const double ghostBorderOpacity = 0.15;
  static const double inputBorderOpacity = 0.2;

  static List<BoxShadow> ambientShadow(Brightness brightness) => [
    BoxShadow(
      color: (brightness == Brightness.dark ? Colors.black : const Color(0xFF0B1C30)).withValues(alpha: 0.06),
      blurRadius: 32,
      offset: const Offset(0, 12),
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
