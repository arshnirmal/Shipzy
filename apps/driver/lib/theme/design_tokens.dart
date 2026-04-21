import 'package:flutter/material.dart';

/// Layout, radius, and opacity tokens shared across the driver app.
///
/// Use with `app_palette.dart` for colors. Values align with
/// `docs/Design-System-Light.md` and `docs/Design-System-Dark.md`.
class AppSpacing {
  AppSpacing._();

  /// Minimum interactive target (Material / WCAG-aligned touch).
  static const double minTouchTarget = 48;

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

  /// Primary geometric language — cards, light-mode buttons, chips (Light §6 Do).
  static const double lg = 8;

  /// FAB / larger controls.
  static const double xl = 16;

  /// Hero / onboarding panels.
  static const double onboardingHero = 24;

  /// Night Navigator primary / outlined buttons (Dark §5).
  static const double darkPrimaryButton = 4;

  static BorderRadius get radiusLg => BorderRadius.circular(lg);
  static BorderRadius get radiusXl => BorderRadius.circular(xl);
  static BorderRadius get radiusOnboardingHero => BorderRadius.circular(onboardingHero);
  static BorderRadius get radiusDarkPrimaryButton => BorderRadius.circular(darkPrimaryButton);
}

class AppDepth {
  AppDepth._();

  /// “Ghost border” — Design-System Light §4 / Dark §2.
  static const double ghostBorderOpacity = 0.15;
}
