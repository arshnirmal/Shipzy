import 'package:flutter/material.dart';

import 'app_palette.dart';

/// Theme extension for gradients, glass, and ambient shadows not in [ColorScheme].
@immutable
class AppThemeExtension extends ThemeExtension<AppThemeExtension> {
  const AppThemeExtension({
    required this.primaryGradient,
    required this.glassmorphismOpacity,
    required this.glassmorphismBlur,
    required this.ambientShadow,
    required this.overlayBreathingMargin,
  });

  final LinearGradient primaryGradient;
  final double glassmorphismOpacity;
  final double glassmorphismBlur;
  final BoxShadow ambientShadow;
  final double overlayBreathingMargin;

  static const AppThemeExtension light = AppThemeExtension(
    primaryGradient: AppPalette.primaryGradientLight,
    glassmorphismOpacity: AppPalette.glassmorphismOpacityLight,
    glassmorphismBlur: AppPalette.glassmorphismBlurLight,
    ambientShadow: AppPalette.ambientShadowLight,
    overlayBreathingMargin: AppPalette.overlayBreathingMargin,
  );

  static const AppThemeExtension dark = AppThemeExtension(
    primaryGradient: AppPalette.primaryGradientDark,
    glassmorphismOpacity: AppPalette.glassmorphismOpacityDark,
    glassmorphismBlur: AppPalette.glassmorphismBlurDark,
    ambientShadow: AppPalette.ambientShadowDark,
    overlayBreathingMargin: AppPalette.overlayBreathingMargin,
  );

  @override
  AppThemeExtension copyWith({
    LinearGradient? primaryGradient,
    double? glassmorphismOpacity,
    double? glassmorphismBlur,
    BoxShadow? ambientShadow,
    double? overlayBreathingMargin,
  }) =>
      AppThemeExtension(
        primaryGradient: primaryGradient ?? this.primaryGradient,
        glassmorphismOpacity: glassmorphismOpacity ?? this.glassmorphismOpacity,
        glassmorphismBlur: glassmorphismBlur ?? this.glassmorphismBlur,
        ambientShadow: ambientShadow ?? this.ambientShadow,
        overlayBreathingMargin: overlayBreathingMargin ?? this.overlayBreathingMargin,
      );

  @override
  AppThemeExtension lerp(ThemeExtension<AppThemeExtension>? other, double t) {
    if (other is! AppThemeExtension) {
      return this;
    }
    return AppThemeExtension(
      primaryGradient: LinearGradient.lerp(primaryGradient, other.primaryGradient, t)!,
      glassmorphismOpacity: _lerpDouble(glassmorphismOpacity, other.glassmorphismOpacity, t),
      glassmorphismBlur: _lerpDouble(glassmorphismBlur, other.glassmorphismBlur, t),
      ambientShadow: BoxShadow.lerp(ambientShadow, other.ambientShadow, t)!,
      overlayBreathingMargin: _lerpDouble(overlayBreathingMargin, other.overlayBreathingMargin, t),
    );
  }

  static double _lerpDouble(double a, double b, double t) => a + (b - a) * t;
}
