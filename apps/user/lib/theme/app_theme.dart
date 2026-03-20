import 'package:flutter/material.dart';

class AppTheme {
  // ==================== FIGMA DESIGN SYSTEM ====================

  // Light mode colors
  static const Color _primaryLight = Color(0xFF6366F1);
  static const Color _backgroundLight = Color(0xFFFFFFFF);
  static const Color _surfaceLight = Color(0xFFFFFFFF);
  static const Color _surfaceVariantLight = Color(0xFFF1F5F9);
  static const Color _borderLight = Color(0xFFF1F5F9);
  static const Color _textPrimaryLight = Color(0xFF1E293B);
  static const Color _textSecondaryLight = Color(0xFF64748B);
  static const Color _textTertiaryLight = Color(0xFF94A3B8);

  // Dark mode colors
  static const Color _primaryDark = Color(0xFF6366F1);
  static const Color _backgroundDark = Color(0xFF0F172A);
  static const Color _surfaceDark = Color(0xFF1E293B);
  static const Color _surfaceVariantDark = Color(0xFF334155);
  static const Color _borderDark = Color(0xFF334155);
  static const Color _textPrimaryDark = Color(0xFFF8FAFC);
  static const Color _textSecondaryDark = Color(0xFFCBD5E1);
  static const Color _textTertiaryDark = Color(0xFF64748B);

  // Common colors
  static const Color _errorLight = Color(0xFFD32F2F);
  static const Color _errorDark = Color(0xFFEF5350);

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: _primaryLight,
      surfaceContainerHighest: _surfaceVariantLight,
      onSurface: _textPrimaryLight,
      onSurfaceVariant: _textSecondaryLight,
      outline: _borderLight,
      error: _errorLight,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundLight,

    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceLight,
      foregroundColor: _textPrimaryLight,
      elevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
    ),

    // Card theme
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: _borderLight),
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
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _borderLight),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _borderLight),
      ),
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
      headlineLarge: TextStyle(color: _textPrimaryLight, fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -0.27),
      headlineMedium: TextStyle(color: _textPrimaryLight, fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.27),
      headlineSmall: TextStyle(color: _textPrimaryLight, fontSize: 14, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: _textPrimaryLight, fontSize: 14, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(color: _textSecondaryLight, fontSize: 12, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(color: _textTertiaryLight, fontSize: 10, fontWeight: FontWeight.w500, letterSpacing: 0.25),
    ),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.dark(
      primary: _primaryDark,
      surface: _surfaceDark,
      surfaceContainerHighest: _surfaceVariantDark,
      onSurface: _textPrimaryDark,
      onSurfaceVariant: _textSecondaryDark,
      outline: _borderDark,
      error: _errorDark,
    ),
    fontFamily: 'Inter',
    scaffoldBackgroundColor: _backgroundDark,

    // AppBar theme
    appBarTheme: const AppBarTheme(
      backgroundColor: _surfaceDark,
      surfaceTintColor: Colors.transparent,
      foregroundColor: _textPrimaryDark,
      elevation: 0,
      centerTitle: true,
    ),

    // Card theme with better contrast
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: const BorderSide(color: _borderDark),
      ),
      color: _surfaceDark,
      shadowColor: Colors.black.withValues(alpha: 0.3),
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
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _borderDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(8),
        borderSide: const BorderSide(color: _borderDark),
      ),
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
      headlineLarge: TextStyle(color: _textPrimaryDark, fontSize: 18, fontWeight: FontWeight.w700, letterSpacing: -0.27),
      headlineMedium: TextStyle(color: _textPrimaryDark, fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: -0.27),
      headlineSmall: TextStyle(color: _textPrimaryDark, fontSize: 14, fontWeight: FontWeight.w600),
      bodyLarge: TextStyle(color: _textPrimaryDark, fontSize: 14, fontWeight: FontWeight.w400),
      bodyMedium: TextStyle(color: _textSecondaryDark, fontSize: 12, fontWeight: FontWeight.w400),
      bodySmall: TextStyle(color: _textTertiaryDark, fontSize: 10, fontWeight: FontWeight.w500, letterSpacing: 0.25),
    ),
  );
}
