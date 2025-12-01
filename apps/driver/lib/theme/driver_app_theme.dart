import 'package:flutter/material.dart';

class DriverAppTheme {
  // ==================== APP COLOR PALETTE (MATCHING USER APP) ====================

  // Primary - Classic Blue
  static const Color _primaryLight = Color(0xFF0F4C81);
  static const Color _primaryDark = Color(0xFF1E88E5);

  // Secondary - Teal
  static const Color _secondaryLight = Color(0xFF00897B);
  static const Color _secondaryDark = Color(0xFF26A69A);

  // Tertiary - Orange
  static const Color _tertiaryLight = Color(0xFFFB8C00);
  static const Color _tertiaryDark = Color(0xFFFFA726);

  // Error - Red
  static const Color _errorLight = Color(0xFFD32F2F);
  static const Color _errorDark = Color(0xFFEF5350);

  // Light mode surfaces
  static const Color _backgroundLight = Color(0xFFF8F9FA);
  static const Color _surfaceLight = Color(0xFFFFFFFF);
  static const Color _surfaceVariantLight = Color(0xFFE8EAED);

  // Dark mode surfaces (Warmer tones from User App)
  static const Color _backgroundDark = Color(0xFF1C1E21);
  static const Color _surfaceDark = Color(0xFF282C34);
  static const Color _surfaceVariantDark = Color(0xFF3A3F4B);

  // ==================== DRIVER STATUS COLORS (KEPT FOR FUNCTIONALITY) ====================

  // Online/Available status - Green (Distinct from Teal secondary)
  static const Color onlineLight = Color(0xFF2E7D32);
  static const Color onlineDark = Color(0xFF66BB6A);

  // Busy/On Delivery status - Orange (Matches Tertiary)
  static const Color busyLight = _tertiaryLight;
  static const Color busyDark = _tertiaryDark;

  // Offline status - Gray
  static const Color offlineLight = Color(0xFF757575);
  static const Color offlineDark = Color(0xFF9E9E9E);

  // Break/Paused status - Yellow
  static const Color pausedLight = Color(0xFFFBC02D);
  static const Color pausedDark = Color(0xFFFFEB3B);

  // ==================== ORDER & EARNINGS COLORS ====================

  static const Color newOrderLight = Color(0xFF1565C0);
  static const Color newOrderDark = Color(0xFF42A5F5);

  static const Color earningsPositiveLight = Color(0xFF2E7D32);
  static const Color earningsPositiveDark = Color(0xFF66BB6A);

  static const Color pendingPayoutLight = Color(0xFFF57C00);
  static const Color pendingPayoutDark = Color(0xFFFFB74D);

  // ==================== LIGHT THEME ====================

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: _primaryLight,
      secondary: _secondaryLight,
      tertiary: _tertiaryLight,
      error: _errorLight,
      surfaceContainerHighest: _surfaceVariantLight,
      onSecondary: Colors.white,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundLight,

    // AppBar theme - Flat design
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceLight,
      foregroundColor: Color(0xFF1C1E21),
      elevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1C1E21), fontFamily: 'Inter'),
    ),

    // Card theme - Flat with border
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: _surfaceVariantLight.withValues(alpha: 0.5)),
      ),
      color: _surfaceLight,
      margin: EdgeInsets.zero,
    ),

    // Elevated button - Primary actions
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryLight,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // Outlined button
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryLight,
        side: const BorderSide(color: _primaryLight),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // Input decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _surfaceVariantLight,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _errorLight, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // Bottom navigation bar
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _surfaceLight,
      selectedItemColor: _primaryLight,
      unselectedItemColor: Color(0xFF757575),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
    ),

    // Floating action button
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _primaryLight,
      foregroundColor: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
    ),

    // Chip theme
    chipTheme: ChipThemeData(
      backgroundColor: _surfaceVariantLight,
      selectedColor: _primaryLight.withValues(alpha: 0.1),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    // Text theme
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Color(0xFF1C1E21), height: 1.2),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFF1C1E21), height: 1.3),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1C1E21), height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: Color(0xFF1C1E21), height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Color(0xFF4A5568), height: 1.5),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF718096), height: 1.5),
    ),
  );

  // ==================== DARK THEME ====================

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.dark(
      primary: _primaryDark,
      secondary: _secondaryDark,
      tertiary: _tertiaryDark,
      error: _errorDark,
      surface: _surfaceDark,
      surfaceContainerHighest: _surfaceVariantDark,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundDark,

    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceDark,
      foregroundColor: Color(0xFFE8EAED),
      elevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFFE8EAED), fontFamily: 'Inter'),
    ),

    // Card theme
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: _surfaceVariantDark.withValues(alpha: 0.3)),
      ),
      color: _surfaceDark,
      margin: EdgeInsets.zero,
    ),

    // Elevated button
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // Outlined button
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryDark,
        side: const BorderSide(color: _primaryDark),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    ),

    // Input decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _surfaceVariantDark,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _primaryDark, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _errorDark, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // Bottom navigation bar
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _surfaceDark,
      selectedItemColor: _primaryDark,
      unselectedItemColor: Color(0xFF8E95A5),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
    ),

    // Floating action button
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _primaryDark,
      foregroundColor: Colors.white,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
    ),

    // Chip theme
    chipTheme: ChipThemeData(
      backgroundColor: _surfaceVariantDark,
      selectedColor: _primaryDark.withValues(alpha: 0.2),
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFFE8EAED)),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    // Text theme
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Color(0xFFE8EAED), height: 1.2),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFFE8EAED), height: 1.3),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFFE8EAED), height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: Color(0xFFE8EAED), height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Color(0xFFB8BCC8), height: 1.5),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF8E95A5), height: 1.5),
    ),
  );

  // ==================== CUSTOM EXTENSIONS ====================

  // Helper method to get status color
  static Color getStatusColor(DriverStatus status, bool isDark) {
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

  // Helper method to get earnings color
  static Color getEarningsColor(double amount, bool isDark) {
    if (amount > 0) {
      return isDark ? earningsPositiveDark : earningsPositiveLight;
    } else if (amount == 0) {
      return isDark ? offlineDark : offlineLight;
    } else {
      return isDark ? _errorDark : _errorLight;
    }
  }
}

// ==================== DRIVER STATUS ENUM ====================

enum DriverStatus {
  online, // Available for orders
  busy, // On active delivery
  offline, // Not available
  paused, // On break
}

// ==================== THEME EXTENSION FOR DRIVER COLORS ====================

extension DriverThemeExtension on ThemeData {
  Color get onlineColor => brightness == Brightness.light ? DriverAppTheme.onlineLight : DriverAppTheme.onlineDark;

  Color get busyColor => brightness == Brightness.light ? DriverAppTheme.busyLight : DriverAppTheme.busyDark;

  Color get offlineColor => brightness == Brightness.light ? DriverAppTheme.offlineLight : DriverAppTheme.offlineDark;

  Color get pausedColor => brightness == Brightness.light ? DriverAppTheme.pausedLight : DriverAppTheme.pausedDark;

  Color get newOrderColor => brightness == Brightness.light ? DriverAppTheme.newOrderLight : DriverAppTheme.newOrderDark;

  Color get earningsColor => brightness == Brightness.light ? DriverAppTheme.earningsPositiveLight : DriverAppTheme.earningsPositiveDark;

  Color get pendingPayoutColor => brightness == Brightness.light ? DriverAppTheme.pendingPayoutLight : DriverAppTheme.pendingPayoutDark;
}
