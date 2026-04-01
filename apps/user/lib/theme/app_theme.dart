import 'package:flutter/material.dart';

import 'app_typography.dart';
import 'design_tokens.dart';

class AppTheme {
  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      primaryContainer: AppColors.primaryGradientEnd,
      surfaceContainerLowest: AppColors.lightSurfaceLowest,
      surfaceContainerLow: AppColors.lightSurfaceLow,
      surfaceContainerHigh: AppColors.lightSurfaceHigh,
      onSurface: AppColors.lightOnSurface,
      onSurfaceVariant: AppColors.lightOnSurfaceVariant,
      outlineVariant: AppColors.outlineVariant,
      error: AppColors.error,
      tertiaryContainer: AppColors.tertiaryContainer,
    ),
    textTheme: AppTypography.lightTextTheme,
    scaffoldBackgroundColor: AppColors.lightSurfaceLow,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.lightSurfaceLow,
      foregroundColor: AppColors.lightOnSurface,
      elevation: 0,
      centerTitle: true,
      surfaceTintColor: Colors.transparent,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      color: AppColors.lightSurfaceLowest,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: AppColors.primary.withValues(alpha: 0.35),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        textStyle: AppTypography.lightTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.ghostBorderOpacity)),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        textStyle: AppTypography.lightTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        textStyle: AppTypography.lightTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.lightSurfaceLowest,
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
      border: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.inputBorderOpacity)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.inputBorderOpacity)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.error, width: 1.8),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.error, width: 1.8),
      ),
      hintStyle: AppTypography.lightTextTheme.bodyMedium,
      labelStyle: AppTypography.lightTextTheme.bodyMedium,
    ),
    dividerColor: Colors.transparent,
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      primaryContainer: AppColors.primaryGradientEnd,
      surfaceContainerLowest: AppColors.darkSurfaceLowest,
      surfaceContainerLow: AppColors.darkSurfaceLow,
      surfaceContainerHigh: AppColors.darkSurfaceHigh,
      onSurface: AppColors.darkOnSurface,
      onSurfaceVariant: AppColors.darkOnSurfaceVariant,
      outlineVariant: AppColors.outlineVariant,
      error: AppColors.error,
      tertiaryContainer: AppColors.tertiaryContainer,
    ),
    textTheme: AppTypography.darkTextTheme,
    scaffoldBackgroundColor: AppColors.darkSurfaceLow,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.darkSurfaceLow,
      surfaceTintColor: Colors.transparent,
      foregroundColor: AppColors.darkOnSurface,
      elevation: 0,
      centerTitle: true,
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
      color: AppColors.darkSurfaceLowest,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        elevation: 2,
        shadowColor: AppColors.primary.withValues(alpha: 0.35),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        textStyle: AppTypography.darkTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.ghostBorderOpacity)),
        shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
        textStyle: AppTypography.darkTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        textStyle: AppTypography.darkTextTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.darkSurfaceLowest,
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.md),
      border: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.inputBorderOpacity)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: BorderSide(color: AppColors.outlineVariant.withValues(alpha: AppDepth.inputBorderOpacity)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.primary, width: 1.8),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.error, width: 1.8),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: AppRadius.radiusLg,
        borderSide: const BorderSide(color: AppColors.error, width: 1.8),
      ),
      hintStyle: AppTypography.darkTextTheme.bodyMedium,
      labelStyle: AppTypography.darkTextTheme.bodyMedium,
    ),
    dividerColor: Colors.transparent,
  );
}
