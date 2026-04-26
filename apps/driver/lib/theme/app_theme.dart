import 'package:flutter/material.dart';

import 'app_palette.dart';
import 'app_theme_extension.dart';
import 'app_typography.dart';
import 'design_tokens.dart';

/// Shipzy driver app themes: **Urban Navigator** (light) and **Night Navigator** (dark).
///
/// Canonical tokens live in [AppPalette], layout in [AppSpacing]/[AppRadius],
/// typography in [AppTypography]. Gradients and glass live in [AppThemeExtension].
///
/// Input fields follow the design docs (bottom indicator, tonal fill shift). See
/// `docs/Design-System-Light.md` §5 and `Design-System-Dark.md` §5–6.
abstract final class AppTheme {
  AppTheme._();

  static const ColorScheme _lightScheme = ColorScheme.light(
    primary: AppPalette.lightPrimary,
    primaryContainer: AppPalette.lightPrimaryContainer,
    onPrimaryContainer: AppPalette.lightOnPrimaryContainer,
    tertiary: AppPalette.lightTertiary,
    tertiaryContainer: AppPalette.lightTertiaryContainer,
    onTertiary: AppPalette.lightOnTertiary,
    onTertiaryContainer: AppPalette.lightOnTertiaryContainer,
    error: AppPalette.lightError,
    errorContainer: AppPalette.lightErrorContainer,
    onErrorContainer: AppPalette.lightOnErrorContainer,
    surface: AppPalette.lightSurface,
    surfaceContainerLowest: AppPalette.lightSurfaceContainerLowest,
    surfaceContainerLow: AppPalette.lightSurfaceContainerLow,
    surfaceContainer: AppPalette.lightSurfaceContainer,
    surfaceContainerHigh: AppPalette.lightSurfaceContainerHigh,
    surfaceContainerHighest: AppPalette.lightSurfaceContainerHighest,
    onSurface: AppPalette.lightOnSurface,
    onSurfaceVariant: AppPalette.lightOnSurfaceVariant,
    outlineVariant: AppPalette.lightOutlineVariant,
  );

  static const ColorScheme _darkScheme = ColorScheme.dark(
    primary: AppPalette.darkPrimary,
    onPrimary: AppPalette.darkOnPrimary,
    primaryContainer: AppPalette.darkPrimaryContainer,
    onPrimaryContainer: AppPalette.darkOnPrimaryContainer,
    tertiary: AppPalette.darkTertiary,
    tertiaryContainer: AppPalette.darkTertiaryContainer,
    onTertiary: AppPalette.darkOnTertiary,
    onTertiaryContainer: AppPalette.darkOnTertiaryContainer,
    error: AppPalette.darkError,
    errorContainer: AppPalette.darkErrorContainer,
    onErrorContainer: AppPalette.darkOnErrorContainer,
    surface: AppPalette.darkSurface,
    surfaceContainerLowest: AppPalette.darkSurfaceContainerLowest,
    surfaceContainerLow: AppPalette.darkSurfaceContainerLow,
    surfaceContainer: AppPalette.darkSurfaceContainer,
    surfaceContainerHigh: AppPalette.darkSurfaceContainerHigh,
    surfaceContainerHighest: AppPalette.darkSurfaceContainerHighest,
    onSurface: AppPalette.darkOnSurface,
    onSurfaceVariant: AppPalette.darkOnSurfaceVariant,
    outlineVariant: AppPalette.darkOutlineVariant,
  );

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    fontFamily: 'PlusJakartaSans',
    colorScheme: _lightScheme,
    scaffoldBackgroundColor: AppPalette.lightSurface,
    extensions: const [AppThemeExtension.light],
    appBarTheme: const AppBarTheme(
      backgroundColor: AppPalette.lightSurfaceContainerLow,
      foregroundColor: AppPalette.lightOnSurface,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontFamily: 'PlusJakartaSans',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppPalette.lightOnSurface,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      color: AppPalette.lightSurfaceContainerHighest,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppPalette.lightPrimary,
        foregroundColor: AppPalette.lightOnPrimary,
        elevation: 0,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppPalette.lightPrimary,
        side: const BorderSide(color: AppPalette.lightPrimary, width: 1.5),
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: _lightInputDecoration(_lightScheme),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppPalette.lightSurfaceContainerLow,
      selectedItemColor: AppPalette.lightPrimary,
      unselectedItemColor: AppPalette.lightOnSurfaceVariant,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppPalette.lightPrimary,
      foregroundColor: AppPalette.lightOnPrimary,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusXl),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppPalette.lightSurfaceContainerHighest,
      selectedColor: const Color.fromRGBO(70, 72, 212, 0.12),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 6,
      ),
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      side: BorderSide.none,
    ),
    textTheme: AppTypography.textTheme(_lightScheme),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    fontFamily: 'PlusJakartaSans',
    colorScheme: _darkScheme,
    scaffoldBackgroundColor: AppPalette.darkSurface,
    extensions: const [AppThemeExtension.dark],
    appBarTheme: const AppBarTheme(
      backgroundColor: AppPalette.darkSurfaceContainerLow,
      foregroundColor: AppPalette.darkOnSurface,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontFamily: 'PlusJakartaSans',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: AppPalette.darkOnSurface,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      color: AppPalette.darkSurfaceContainerHighest,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppPalette.darkPrimaryContainer,
        foregroundColor: AppPalette.darkOnPrimaryContainer,
        elevation: 0,
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.radiusDarkPrimaryButton,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppPalette.darkPrimary,
        side: const BorderSide(color: AppPalette.darkPrimary, width: 1.5),
        minimumSize: const Size.fromHeight(56),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadius.radiusDarkPrimaryButton,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: _darkInputDecoration(_darkScheme),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppPalette.darkSurfaceContainerLow,
      selectedItemColor: AppPalette.darkPrimary,
      unselectedItemColor: AppPalette.darkOnSurfaceVariant,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: AppPalette.darkPrimaryContainer,
      foregroundColor: AppPalette.darkOnPrimaryContainer,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusXl),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppPalette.darkSurfaceContainerHighest,
      selectedColor: const Color.fromRGBO(192, 193, 255, 0.20),
      labelStyle: const TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: AppPalette.darkOnSurface,
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 6,
      ),
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      side: BorderSide.none,
    ),
    textTheme: AppTypography.textTheme(_darkScheme),
  );

  /// Light: `surface_container_high` → `surface_container_highest` on focus; bottom bar indicator (Design-System-Light §5).
  static InputDecorationTheme _lightInputDecoration(ColorScheme scheme) {
    final ghost = scheme.outlineVariant.withValues(
      alpha: AppDepth.ghostBorderOpacity,
    );
    final borderRadius = BorderRadius.circular(AppRadius.lg);
    return InputDecorationTheme(
      filled: true,
      fillColor: WidgetStateColor.resolveWith((states) {
        if (states.contains(WidgetState.focused)) {
          return AppPalette.lightSurfaceContainerHighest;
        }
        return AppPalette.lightSurfaceContainerHigh;
      }),
      hintStyle: TextStyle(
        color: scheme.onSurfaceVariant.withValues(alpha: 0.75),
      ),
      labelStyle: WidgetStateTextStyle.resolveWith((states) {
        final base = TextStyle(
          color: scheme.onSurfaceVariant,
          fontWeight: FontWeight.w500,
        );
        if (states.contains(WidgetState.error)) {
          return base.copyWith(color: scheme.error);
        }
        if (states.contains(WidgetState.focused)) {
          return base.copyWith(color: scheme.primary);
        }
        return base;
      }),
      floatingLabelStyle: WidgetStateTextStyle.resolveWith((states) {
        final base = TextStyle(
          color: scheme.onSurfaceVariant,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        );
        if (states.contains(WidgetState.error)) {
          return base.copyWith(color: scheme.error);
        }
        if (states.contains(WidgetState.focused)) {
          return base.copyWith(color: scheme.primary);
        }
        return base;
      }),
      border: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide.none,
      ),
      enabledBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(color: ghost),
      ),
      focusedBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: AppPalette.lightPrimary, width: 2),
      ),
      errorBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(color: scheme.error.withValues(alpha: 0.9)),
      ),
      focusedErrorBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(color: scheme.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 14,
      ),
    );
  }

  /// Dark: minimalist `surface_container_highest` fill; bottom bar → primary on focus. Avoid heavy red fills (Design-System-Dark §5–6).
  static InputDecorationTheme _darkInputDecoration(ColorScheme scheme) {
    final bar = scheme.outlineVariant.withValues(
      alpha: AppDepth.ghostBorderOpacity,
    );
    final borderRadius = BorderRadius.circular(AppRadius.lg);
    return InputDecorationTheme(
      filled: true,
      fillColor: WidgetStateColor.resolveWith(
        (_) => AppPalette.darkSurfaceContainerHighest,
      ),
      hintStyle: TextStyle(
        color: scheme.onSurfaceVariant.withValues(alpha: 0.8),
      ),
      labelStyle: WidgetStateTextStyle.resolveWith((states) {
        final base = TextStyle(
          color: scheme.onSurfaceVariant,
          fontWeight: FontWeight.w500,
        );
        if (states.contains(WidgetState.error)) {
          return base.copyWith(color: scheme.error);
        }
        if (states.contains(WidgetState.focused)) {
          return base.copyWith(color: scheme.primary);
        }
        return base;
      }),
      floatingLabelStyle: WidgetStateTextStyle.resolveWith((states) {
        final base = TextStyle(
          color: scheme.onSurfaceVariant,
          fontWeight: FontWeight.w500,
          fontSize: 12,
        );
        if (states.contains(WidgetState.error)) {
          return base.copyWith(color: scheme.error);
        }
        if (states.contains(WidgetState.focused)) {
          return base.copyWith(color: scheme.primary);
        }
        return base;
      }),
      border: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide.none,
      ),
      enabledBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(color: bar, width: 2),
      ),
      focusedBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: const BorderSide(color: AppPalette.darkPrimary, width: 2),
      ),
      errorBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(
          color: scheme.error.withValues(alpha: 0.85),
          width: 2,
        ),
      ),
      focusedErrorBorder: UnderlineInputBorder(
        borderRadius: borderRadius,
        borderSide: BorderSide(color: scheme.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: 14,
      ),
    );
  }
}

/// Convenience accessors for palette + [AppThemeExtension] on [ThemeData].
extension AppThemeData on ThemeData {
  AppThemeExtension get _ext => extension<AppThemeExtension>()!;

  bool get _isDark => brightness == Brightness.dark;

  LinearGradient get primaryGradient => _ext.primaryGradient;

  BoxShadow get ambientShadow => _ext.ambientShadow;

  double get glassmorphismOpacity => _ext.glassmorphismOpacity;

  double get glassmorphismBlur => _ext.glassmorphismBlur;

  double get overlayBreathingMargin => _ext.overlayBreathingMargin;

  Color get onlineColor =>
      _isDark ? AppPalette.onlineDark : AppPalette.onlineLight;

  Color get onlineBgColor =>
      _isDark ? AppPalette.onlineBgDark : AppPalette.onlineBgLight;

  Color get busyColor => _isDark ? AppPalette.busyDark : AppPalette.busyLight;

  Color get offlineColor =>
      _isDark ? AppPalette.offlineDark : AppPalette.offlineLight;

  Color get pausedColor =>
      _isDark ? AppPalette.pausedDark : AppPalette.pausedLight;

  Color get earningsColor => _isDark
      ? AppPalette.earningsPositiveDark
      : AppPalette.earningsPositiveLight;

  Color get pendingPayoutColor =>
      _isDark ? AppPalette.pendingPayoutDark : AppPalette.pendingPayoutLight;
}
