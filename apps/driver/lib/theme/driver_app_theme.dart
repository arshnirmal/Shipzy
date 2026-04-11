import 'package:flutter/material.dart';

// ==================== DRIVER STATUS ENUM ====================
// Defined at library level so it can be used without a DriverAppTheme prefix.

enum DriverStatus {
  online, // Available, accepting trips
  busy, // On active delivery
  offline, // Not on duty
  paused, // On break
}

// ==============================================================
//  DriverAppTheme — "Urban Navigator" / "Night Navigator"
//  Light and dark palettes follow the respective design system
//  docs in apps/driver/docs/.
//  Font: Plus Jakarta Sans (PlusJakartaSans family in pubspec).
// ==============================================================

class DriverAppTheme {
  DriverAppTheme._(); // pure static utility — not instantiable

  // ==================== LIGHT PALETTE ====================
  // Primary — Electric Indigo
  static const Color _primaryLight = Color(0xFF4648D4);
  static const Color _primaryContainerLight = Color(0xFF6063EE); // gradient end
  static const Color _onPrimaryLight = Colors.white;
  static const Color _onPrimaryContainerLight = Color(0xFF06008F);

  // Surface hierarchy (No-Line Rule — depth through tonal shift, no borders)
  static const Color _surfaceLight = Color(0xFFFCF8FF);
  static const Color _surfaceContainerLowestLight = Color(0xFFF8F5FF);
  static const Color _surfaceContainerLowLight = Color(0xFFF5F2FE);
  static const Color _surfaceContainerLight = Color(0xFFEFECF6);
  static const Color _surfaceContainerHighLight = Color(0xFFE9E6F0);
  static const Color _surfaceContainerHighestLight = Color(0xFFE4E1ED);
  static const Color _onSurfaceLight = Color(0xFF1B1B23);
  static const Color _onSurfaceVariantLight = Color(0xFF47464F);
  static const Color _outlineVariantLight = Color(0xFFC9C5D0);

  // Tertiary — "Online" state green (not a generic accent)
  static const Color _tertiaryLight = Color(0xFF006C49);
  static const Color _tertiaryContainerLight = Color(0xFF89F8C7);
  static const Color _onTertiaryLight = Colors.white;
  static const Color _onTertiaryContainerLight = Color(0xFF002115);

  // Error
  static const Color _errorLight = Color(0xFFBA1A1A);
  static const Color _errorContainerLight = Color(0xFFFFDAD6);
  static const Color _onErrorContainerLight = Color(0xFF410002);

  // ==================== DARK PALETTE ====================
  // Primary — high-contrast Electric Indigo tonal for OLED
  static const Color _primaryDark = Color(0xFFC0C1FF);
  static const Color _primaryContainerDark = Color(0xFF8083FF); // gradient end
  static const Color _onPrimaryDark = Color(0xFF0D0FAA);
  static const Color _onPrimaryContainerDark = Color(0xFF1A1C82);

  // Surface hierarchy — OLED-efficient deep charcoals
  static const Color _surfaceDark = Color(0xFF131313);
  static const Color _surfaceContainerLowestDark = Color(0xFF0E0E0E);
  static const Color _surfaceContainerLowDark = Color(0xFF1C1B1B);
  static const Color _surfaceContainerDark = Color(0xFF242422);
  static const Color _surfaceContainerHighDark = Color(0xFF2E2D2C);
  static const Color _surfaceContainerHighestDark = Color(0xFF353534);
  static const Color _onSurfaceDark = Color(0xFFE5E2E1);
  static const Color _onSurfaceVariantDark = Color(0xFFC9C6C4);
  static const Color _outlineVariantDark = Color(0xFF47464E);

  // Tertiary — lighter online green for dark backgrounds
  static const Color _tertiaryDark = Color(0xFF6DDBAB);
  static const Color _tertiaryContainerDark = Color(0xFF005138);
  static const Color _onTertiaryDark = Color(0xFF003825);
  static const Color _onTertiaryContainerDark = Color(0xFF89F8C7);

  // Error
  static const Color _errorDark = Color(0xFFFFB4AB);
  static const Color _errorContainerDark = Color(0xFF93000A);
  static const Color _onErrorContainerDark = Color(0xFFFFDAD6);

  // ==================== PUBLIC STATUS COLORS ====================
  // Used by DriverThemeExtension and UI code directly.

  static const Color onlineLight = _tertiaryLight;
  static const Color onlineDark = _tertiaryDark;
  static const Color onlineBgLight = _tertiaryContainerLight;
  static const Color onlineBgDark = _tertiaryContainerDark;

  // Busy — deep orange; distinct from indigo primary and green tertiary
  static const Color busyLight = Color(0xFFE65100);
  static const Color busyDark = Color(0xFFFFB74D);

  static const Color offlineLight = _onSurfaceVariantLight;
  static const Color offlineDark = _onSurfaceVariantDark;

  // Paused — amber
  static const Color pausedLight = Color(0xFFF57C00);
  static const Color pausedDark = Color(0xFFFFCC02);

  static const Color earningsPositiveLight = _tertiaryLight;
  static const Color earningsPositiveDark = _tertiaryDark;

  static const Color pendingPayoutLight = Color(0xFFE65100);
  static const Color pendingPayoutDark = Color(0xFFFFB74D);

  // ==================== GRADIENT SPECS ====================
  // Primary CTA: linear from primary → primaryContainer at 135°.
  // Flutter ElevatedButton cannot express gradients natively — use the
  // GradientButton widget (lib/widgets/gradient_button.dart) for all
  // primary CTAs ("Accept Trip", "Go Online", etc.).

  static const LinearGradient primaryGradientLight = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [_primaryLight, _primaryContainerLight],
  );

  static const LinearGradient primaryGradientDark = LinearGradient(
    begin: Alignment.topRight,
    end: Alignment.bottomLeft,
    colors: [_primaryDark, _primaryContainerDark],
  );

  // ==================== SHADOW SPECS ====================
  // Light: primary-tinted ambient, 6% opacity, 16px blur.
  // Dark: pure black occlusion shadow for floating sheets, 40% opacity.

  static const BoxShadow ambientShadowLight = BoxShadow(
    color: Color.fromRGBO(70, 72, 212, 0.06),
    blurRadius: 16,
    offset: Offset(0, 4),
  );

  static const BoxShadow ambientShadowDark = BoxShadow(
    color: Color.fromRGBO(0, 0, 0, 0.40),
    blurRadius: 48,
    spreadRadius: -24,
    offset: Offset(0, 24),
  );

  // ==================== GLASSMORPHISM SPECS ====================
  // Light overlays: surface_container_lowest at 85%, 24px blur.
  // Dark overlays: surface_variant at 60%, 20px blur.
  // Applied manually to BackdropFilter widgets; not expressible in ThemeData.

  static const double glassmorphismOpacityLight = 0.85;
  static const double glassmorphismBlurLight = 24;

  static const double glassmorphismOpacityDark = 0.60;
  static const double glassmorphismBlurDark = 20;

  /// Minimum safe margin between a map overlay and the screen edge.
  static const double overlayBreathingMargin = 16;

  // ==================== LIGHT THEME ====================

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    fontFamily: 'PlusJakartaSans',
    colorScheme: const ColorScheme.light(
      primary: _primaryLight,
      primaryContainer: _primaryContainerLight,
      onPrimaryContainer: _onPrimaryContainerLight,
      tertiary: _tertiaryLight,
      tertiaryContainer: _tertiaryContainerLight,
      onTertiary: _onTertiaryLight,
      onTertiaryContainer: _onTertiaryContainerLight,
      error: _errorLight,
      errorContainer: _errorContainerLight,
      onErrorContainer: _onErrorContainerLight,
      surface: _surfaceLight,
      surfaceContainerLowest: _surfaceContainerLowestLight,
      surfaceContainerLow: _surfaceContainerLowLight,
      surfaceContainer: _surfaceContainerLight,
      surfaceContainerHigh: _surfaceContainerHighLight,
      surfaceContainerHighest: _surfaceContainerHighestLight,
      onSurface: _onSurfaceLight,
      onSurfaceVariant: _onSurfaceVariantLight,
      outlineVariant: _outlineVariantLight,
    ),
    scaffoldBackgroundColor: _surfaceLight,

    // Flat; no elevation tint; containerLow acts as a visual step up from canvas
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceContainerLowLight,
      foregroundColor: _onSurfaceLight,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontFamily: 'PlusJakartaSans',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        letterSpacing: 0,
      ),
    ),

    // No-Line Rule: no border. Lift via tonal color only.
    cardTheme: const CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      color: _surfaceContainerHighestLight,
      margin: EdgeInsets.zero,
      // For floating cards use ambientShadowLight via BoxDecoration in the widget.
    ),

    // ElevatedButton handles non-gradient cases. Primary CTAs use GradientButton.
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryLight,
        foregroundColor: _onPrimaryLight,
        elevation: 0,
        minimumSize: const Size.fromHeight(56),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryLight,
        side: const BorderSide(color: _primaryLight, width: 1.5),
        minimumSize: const Size.fromHeight(56),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(8)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
      ),
    ),

    // Tertiary actions (low-priority: "View History") use TextButton defaults.

    // Borderless fill; background shifts to containerHighest on focus;
    // 2px primary bottom-only indicator replaces the full outline border.
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: _surfaceContainerHighLight,
      border: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide.none,
      ),
      enabledBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide.none,
      ),
      focusedBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _primaryLight, width: 2),
      ),
      errorBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _errorLight, width: 2),
      ),
      focusedErrorBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _errorLight, width: 2),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _surfaceContainerLowLight,
      selectedItemColor: _primaryLight,
      unselectedItemColor: _onSurfaceVariantLight,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
    ),

    // FAB glow is applied per-widget via ambientShadowLight; elevation stays 0.
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _primaryLight,
      foregroundColor: _onPrimaryLight,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),

    chipTheme: const ChipThemeData(
      backgroundColor: _surfaceContainerHighestLight,
      // primary at 12% — expressed as a fixed RGBA to keep const
      selectedColor: Color.fromRGBO(70, 72, 212, 0.12),
      labelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      side: BorderSide.none,
    ),

    // Plus Jakarta Sans editorial scale.
    // displaySmall → critical metrics (earnings, ETA). Feels like a magazine headline.
    // headlineSmall → job card titles; legible at arm's length.
    // labelMedium / labelSmall → metadata; apply uppercase + 0.7 tracking at the widget level.
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.w700,
        color: _onSurfaceLight,
        height: 1.1,
        letterSpacing: -0.5,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: _onSurfaceLight,
        height: 1.2,
      ),
      headlineSmall: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        height: 1.3,
      ),
      titleLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        height: 1.4,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        height: 1.4,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        height: 1.4,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: _onSurfaceLight,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: _onSurfaceVariantLight,
        height: 1.5,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: _onSurfaceVariantLight,
        height: 1.5,
      ),
      // Metadata labels — callers apply TextStyle(letterSpacing: 0.7) and uppercase.
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: _onSurfaceLight,
        height: 1.3,
        letterSpacing: 0.5,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: _onSurfaceVariantLight,
        height: 1.3,
        letterSpacing: 0.7,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: _onSurfaceVariantLight,
        height: 1.3,
        letterSpacing: 0.7,
      ),
    ),
  );

  // ==================== DARK THEME ====================

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    fontFamily: 'PlusJakartaSans',
    colorScheme: const ColorScheme.dark(
      primary: _primaryDark,
      onPrimary: _onPrimaryDark,
      primaryContainer: _primaryContainerDark,
      onPrimaryContainer: _onPrimaryContainerDark,
      tertiary: _tertiaryDark,
      tertiaryContainer: _tertiaryContainerDark,
      onTertiary: _onTertiaryDark,
      onTertiaryContainer: _onTertiaryContainerDark,
      error: _errorDark,
      errorContainer: _errorContainerDark,
      onErrorContainer: _onErrorContainerDark,
      surface: _surfaceDark,
      surfaceContainerLowest: _surfaceContainerLowestDark,
      surfaceContainerLow: _surfaceContainerLowDark,
      surfaceContainer: _surfaceContainerDark,
      surfaceContainerHigh: _surfaceContainerHighDark,
      surfaceContainerHighest: _surfaceContainerHighestDark,
      onSurface: _onSurfaceDark,
      onSurfaceVariant: _onSurfaceVariantDark,
      outlineVariant: _outlineVariantDark,
    ),
    scaffoldBackgroundColor: _surfaceDark,

    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceContainerLowDark,
      foregroundColor: _onSurfaceDark,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      shadowColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontFamily: 'PlusJakartaSans',
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        letterSpacing: 0,
      ),
    ),

    cardTheme: const CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      color: _surfaceContainerHighestDark,
      margin: EdgeInsets.zero,
    ),

    // Dark system specifies 4px radius on primary buttons (precision instrument feel).
    // Background: primaryContainer; text: onPrimaryContainer.
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryContainerDark,
        foregroundColor: _onPrimaryContainerDark,
        elevation: 0,
        minimumSize: const Size.fromHeight(56),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
      ),
    ),

    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryDark,
        side: const BorderSide(color: _primaryDark, width: 1.5),
        minimumSize: const Size.fromHeight(56),
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(4)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
          letterSpacing: 0,
        ),
      ),
    ),

    // Minimalist input: containerHighest 2px bottom bar; glows primary on focus.
    inputDecorationTheme: const InputDecorationTheme(
      filled: true,
      fillColor: _surfaceContainerHighestDark,
      border: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide.none,
      ),
      enabledBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(
          color: _surfaceContainerHighestDark,
          width: 2,
        ),
      ),
      focusedBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _primaryDark, width: 2),
      ),
      // Error text/icon uses error token; avoid red fill to keep Night Navigator calm.
      errorBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _errorDark, width: 2),
      ),
      focusedErrorBorder: UnderlineInputBorder(
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(8),
          topRight: Radius.circular(8),
        ),
        borderSide: BorderSide(color: _errorDark, width: 2),
      ),
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _surfaceContainerLowDark,
      selectedItemColor: _primaryDark,
      unselectedItemColor: _onSurfaceVariantDark,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
    ),

    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _primaryContainerDark,
      foregroundColor: _onPrimaryContainerDark,
      elevation: 0,
      focusElevation: 0,
      hoverElevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(16)),
      ),
    ),

    chipTheme: const ChipThemeData(
      backgroundColor: _surfaceContainerHighestDark,
      // primary at 20% — expressed as fixed RGBA
      selectedColor: Color.fromRGBO(192, 193, 255, 0.20),
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: _onSurfaceDark,
      ),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(8)),
      ),
      side: BorderSide.none,
    ),

    // Same typographic scale as light; color tokens adjust automatically.
    textTheme: const TextTheme(
      displaySmall: TextStyle(
        fontSize: 36,
        fontWeight: FontWeight.w700,
        color: _onSurfaceDark,
        height: 1.1,
        letterSpacing: -0.5,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        color: _onSurfaceDark,
        height: 1.2,
      ),
      headlineSmall: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        height: 1.3,
      ),
      titleLarge: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        height: 1.4,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        height: 1.4,
      ),
      titleSmall: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        height: 1.4,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        color: _onSurfaceDark,
        height: 1.5,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        color: _onSurfaceVariantDark,
        height: 1.5,
      ),
      bodySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
        color: _onSurfaceVariantDark,
        height: 1.5,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: _onSurfaceDark,
        height: 1.3,
        letterSpacing: 0.5,
      ),
      labelMedium: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: _onSurfaceVariantDark,
        height: 1.3,
        letterSpacing: 0.7,
      ),
      labelSmall: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w600,
        color: _onSurfaceVariantDark,
        height: 1.3,
        letterSpacing: 0.7,
      ),
    ),
  );

  // ==================== STATUS COLOR HELPERS ====================

  static Color getStatusColor(DriverStatus status, {required bool isDark}) {
    switch (status) {
      case DriverStatus.online:
        return isDark ? onlineDark : onlineLight;
      case DriverStatus.busy:
        return isDark ? busyDark : busyLight;
      case DriverStatus.offline:
        return isDark ? offlineDark : offlineLight;
      case DriverStatus.paused:
        return isDark ? pausedDark : pausedLight;
    }
  }

  static Color getEarningsColor(double amount, {required bool isDark}) {
    if (amount > 0) {
      return isDark ? earningsPositiveDark : earningsPositiveLight;
    }
    if (amount == 0) {
      return isDark ? offlineDark : offlineLight;
    }
    return isDark ? _errorDark : _errorLight;
  }
}

// ==================== THEME EXTENSION ====================
// Access design-system-specific tokens from any widget via
//   Theme.of(context).onlineColor
//   Theme.of(context).primaryGradient
//   Theme.of(context).ambientShadow
// etc.

extension DriverThemeExtension on ThemeData {
  bool get _isDark => brightness == Brightness.dark;

  Color get onlineColor =>
      _isDark ? DriverAppTheme.onlineDark : DriverAppTheme.onlineLight;

  Color get onlineBgColor =>
      _isDark ? DriverAppTheme.onlineBgDark : DriverAppTheme.onlineBgLight;

  Color get busyColor =>
      _isDark ? DriverAppTheme.busyDark : DriverAppTheme.busyLight;

  Color get offlineColor =>
      _isDark ? DriverAppTheme.offlineDark : DriverAppTheme.offlineLight;

  Color get pausedColor =>
      _isDark ? DriverAppTheme.pausedDark : DriverAppTheme.pausedLight;

  Color get earningsColor =>
      _isDark ? DriverAppTheme.earningsPositiveDark : DriverAppTheme.earningsPositiveLight;

  Color get pendingPayoutColor =>
      _isDark ? DriverAppTheme.pendingPayoutDark : DriverAppTheme.pendingPayoutLight;

  LinearGradient get primaryGradient =>
      _isDark ? DriverAppTheme.primaryGradientDark : DriverAppTheme.primaryGradientLight;

  /// Primary-tinted ambient shadow (light) / pure-black occlusion shadow (dark).
  /// Use in a BoxDecoration's boxShadow list on floating elements.
  BoxShadow get ambientShadow =>
      _isDark ? DriverAppTheme.ambientShadowDark : DriverAppTheme.ambientShadowLight;

  double get glassmorphismOpacity => _isDark
      ? DriverAppTheme.glassmorphismOpacityDark
      : DriverAppTheme.glassmorphismOpacityLight;

  double get glassmorphismBlur => _isDark
      ? DriverAppTheme.glassmorphismBlurDark
      : DriverAppTheme.glassmorphismBlurLight;
}
