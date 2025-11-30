import 'package:flutter/material.dart';

class DriverAppTheme {
  // ==================== DRIVER APP COLOR PALETTE ====================

  // Primary - Professional Deep Blue (slightly darker than user app)
  static const Color _primaryLight = Color(0xFF0D3B66); // Deeper blue for professionalism
  static const Color _primaryDark = Color(0xFF1976D2);

  // Secondary - Success/Earnings Green (instead of teal)
  static const Color _secondaryLight = Color(0xFF2E7D32); // Earnings green
  static const Color _secondaryDark = Color(0xFF43A047);

  // Tertiary - Action Orange (same as user app for consistency)
  static const Color _tertiaryLight = Color(0xFFFB8C00);
  static const Color _tertiaryDark = Color(0xFFFFA726);

  // Error - Critical Red
  static const Color _errorLight = Color(0xFFC62828);
  static const Color _errorDark = Color(0xFFE57373);

  // Light mode surfaces
  static const Color _backgroundLight = Color(0xFFF5F5F7); // Slightly cooler gray
  static const Color _surfaceLight = Color(0xFFFFFFFF);
  static const Color _surfaceVariantLight = Color(0xFFE0E3E8);

  // Dark mode surfaces (professional dark theme)
  static const Color _backgroundDark = Color(0xFF121212); // True dark for night driving
  static const Color _surfaceDark = Color(0xFF1E1E1E);
  static const Color _surfaceVariantDark = Color(0xFF2C2C2C);

  // ==================== DRIVER STATUS COLORS ====================

  // Online/Available status
  static const Color onlineLight = Color(0xFF2E7D32); // Strong green
  static const Color onlineDark = Color(0xFF4CAF50);

  // Busy/On Delivery status
  static const Color busyLight = Color(0xFFED6C02); // Orange
  static const Color busyDark = Color(0xFFFF9800);

  // Offline status
  static const Color offlineLight = Color(0xFF757575); // Gray
  static const Color offlineDark = Color(0xFF9E9E9E);

  // Break/Paused status
  static const Color pausedLight = Color(0xFFFBC02D); // Yellow
  static const Color pausedDark = Color(0xFFFFEB3B);

  // ==================== ORDER & EARNINGS COLORS ====================

  // New order alert (high priority)
  static const Color newOrderLight = Color(0xFF1565C0);
  static const Color newOrderDark = Color(0xFF42A5F5);

  // Earnings positive
  static const Color earningsPositiveLight = Color(0xFF2E7D32);
  static const Color earningsPositiveDark = Color(0xFF66BB6A);

  // Pending payout
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
      surface: _surfaceLight,
      surfaceContainerHighest: _surfaceVariantLight,
      onPrimary: Colors.white,
      onSecondary: Colors.white,
      onSurface: Color(0xFF1A1C1E),
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundLight,

    // AppBar theme - Slightly elevated for hierarchy
    appBarTheme: AppBarTheme(
      backgroundColor: _surfaceLight,
      foregroundColor: const Color(0xFF1A1C1E),
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.08),
      centerTitle: false, // Left-aligned for driver app
      surfaceTintColor: Colors.transparent,
      titleTextStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), fontFamily: 'Inter'),
    ),

    // Card theme with subtle elevation
    cardTheme: CardThemeData(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: _surfaceLight,
      shadowColor: Colors.black.withValues(alpha: 0.08),
    ),

    // Elevated button - Primary actions
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryLight,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: _primaryLight.withValues(alpha: 0.3),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),

    // Outlined button - Secondary actions
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryLight,
        side: const BorderSide(color: _primaryLight, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      ),
    ),

    // Text button - Tertiary actions
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: _primaryLight, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
    ),

    // Input decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _surfaceVariantLight,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _primaryLight, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
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
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
    ),

    // Chip theme (for status badges)
    chipTheme: ChipThemeData(
      backgroundColor: _surfaceVariantLight,
      selectedColor: _primaryLight,
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    // Divider theme
    dividerTheme: DividerThemeData(color: _surfaceVariantLight, thickness: 1, space: 16),

    // Text theme with professional hierarchy
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Color(0xFF1A1C1E), height: 1.2),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Color(0xFF1A1C1E), height: 1.2),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), height: 1.3),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), height: 1.3),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), height: 1.4),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: Color(0xFF1A1C1E), height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Color(0xFF49454F), height: 1.5),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF73777F), height: 1.5),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF1A1C1E), height: 1.4),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF49454F), height: 1.4),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF73777F), height: 1.4),
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
      onSurface: Color(0xFFE6E1E5),
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundDark,

    // AppBar theme
    appBarTheme: AppBarTheme(
      backgroundColor: _surfaceDark,
      foregroundColor: const Color(0xFFE6E1E5),
      elevation: 1,
      shadowColor: Colors.black.withValues(alpha: 0.3),
      centerTitle: false,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), fontFamily: 'Inter'),
    ),

    // Card theme
    cardTheme: CardThemeData(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: _surfaceDark,
      shadowColor: Colors.black.withValues(alpha: 0.4),
    ),

    // Elevated button
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryDark,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: _primaryDark.withValues(alpha: 0.4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    ),

    // Outlined button
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: _primaryDark,
        side: const BorderSide(color: _primaryDark, width: 1.5),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      ),
    ),

    // Text button
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(foregroundColor: _primaryDark, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
    ),

    // Input decoration
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: _surfaceVariantDark,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide.none),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _primaryDark, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: _errorDark, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),

    // Bottom navigation bar
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: _surfaceDark,
      selectedItemColor: _primaryDark,
      unselectedItemColor: Color(0xFF9E9E9E),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
      selectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
    ),

    // Floating action button
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: _primaryDark,
      foregroundColor: Colors.white,
      elevation: 6,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(16))),
    ),

    // Chip theme
    chipTheme: ChipThemeData(
      backgroundColor: _surfaceVariantDark,
      selectedColor: _primaryDark,
      labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: Color(0xFFE6E1E5)),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
    ),

    // Divider theme
    dividerTheme: DividerThemeData(color: _surfaceVariantDark, thickness: 1, space: 16),

    // Text theme
    textTheme: const TextTheme(
      displayLarge: TextStyle(fontSize: 32, fontWeight: FontWeight.w700, color: Color(0xFFE6E1E5), height: 1.2),
      displayMedium: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, color: Color(0xFFE6E1E5), height: 1.2),
      headlineLarge: TextStyle(fontSize: 24, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), height: 1.3),
      headlineMedium: TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), height: 1.3),
      titleLarge: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), height: 1.4),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), height: 1.4),
      bodyLarge: TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: Color(0xFFE6E1E5), height: 1.5),
      bodyMedium: TextStyle(fontSize: 14, fontWeight: FontWeight.w400, color: Color(0xFFCAC4D0), height: 1.5),
      bodySmall: TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: Color(0xFF938F99), height: 1.5),
      labelLarge: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFFE6E1E5), height: 1.4),
      labelMedium: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFFCAC4D0), height: 1.4),
      labelSmall: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: Color(0xFF938F99), height: 1.4),
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
