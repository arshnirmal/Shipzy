import 'package:flutter/material.dart';

class AppTheme {
  // ==================== OPTION A: NEW PALETTE ====================

  // Color definitions
  static const Color _primaryLight = Color(0xFF0F4C81);
  static const Color _primaryDark = Color(0xFF1E88E5);

  static const Color _secondaryLight = Color(0xFF00897B);
  static const Color _secondaryDark = Color(0xFF26A69A);

  static const Color _tertiaryLight = Color(0xFFFB8C00);
  static const Color _tertiaryDark = Color(0xFFFFA726);

  static const Color _errorLight = Color(0xFFD32F2F);
  static const Color _errorDark = Color(0xFFEF5350);

  // Light mode surfaces
  static const Color _backgroundLight = Color(0xFFF8F9FA);
  static const Color _surfaceLight = Color(0xFFFFFFFF);
  static const Color _surfaceVariantLight = Color(0xFFE8EAED);

  // Dark mode surfaces (warmer tones)
  static const Color _backgroundDark = Color(0xFF1C1E21);
  static const Color _surfaceDark = Color(0xFF282C34);
  static const Color _surfaceVariantDark = Color(0xFF3A3F4B);

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: _primaryLight,
      secondary: _secondaryLight,
      tertiary: _tertiaryLight,
      error: _errorLight,
      surfaceContainerHighest: _surfaceVariantLight,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundLight,

    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceLight,
      foregroundColor: Color(0xFF1C1E21),
      elevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
    ),

    // Card theme
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: _surfaceVariantLight.withValues(alpha: 0.5)),
      ),
      color: _surfaceLight,
      shadowColor: Colors.black.withValues(alpha: 0.05),
    ),

    // Elevated button theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryLight,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    ),

    // Input decoration theme
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
    ),

    // Text theme with better hierarchy
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFF1C1E21)),
      bodyMedium: TextStyle(color: Color(0xFF4A5568)),
      bodySmall: TextStyle(color: Color(0xFF718096)),
    ),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.dark(
      primary: _primaryDark,
      secondary: _secondaryDark,
      tertiary: _tertiaryDark,
      error: _errorDark,
      surface: _surfaceDark,
      surfaceContainerHighest: _surfaceVariantDark,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundDark,

    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceDark,
      surfaceTintColor: Colors.transparent,
      foregroundColor: Color(0xFFE8EAED),
      elevation: 0,
      centerTitle: true,
    ),

    // Card theme with better contrast
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: _surfaceVariantDark.withValues(alpha: 0.3)),
      ),
      color: _surfaceDark,
    ),

    // Elevated button theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: _primaryDark,
        foregroundColor: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
    ),

    // Input decoration theme
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
    ),

    // Text theme with better hierarchy
    textTheme: const TextTheme(
      bodyLarge: TextStyle(color: Color(0xFFE8EAED)),
      bodyMedium: TextStyle(color: Color(0xFFB8BCC8)),
      bodySmall: TextStyle(color: Color(0xFF8E95A5)),
    ),
  );
}
