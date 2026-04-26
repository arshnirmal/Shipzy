import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'design_tokens.dart';

class AppTypography {
  AppTypography._();

  static TextTheme lightTextTheme = TextTheme(
    displayLarge: _style(fontSize: 56, fontWeight: FontWeight.w800, color: AppColors.lightOnSurface, height: 1.05, letterSpacing: -1.1),
    headlineLarge: _style(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.lightOnSurface, height: 1.15, letterSpacing: -0.5),
    headlineMedium: _style(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.lightOnSurface, height: 1.2, letterSpacing: -0.5),
    headlineSmall: _style(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.lightOnSurface, height: 1.25, letterSpacing: -0.3),
    titleLarge: _style(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.lightOnSurface, height: 1.3),
    titleMedium: _style(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.lightOnSurface, height: 1.3),
    titleSmall: _style(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.lightOnSurface, height: 1.35),
    bodyLarge: _style(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.lightOnSurface, height: 1.5),
    bodyMedium: _style(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.lightOnSurfaceVariant, height: 1.45),
    bodySmall: _style(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.lightOnSurfaceVariant, height: 1.4),
    labelSmall: _style(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.lightOnSurfaceVariant, height: 1.35),
  );

  static TextTheme darkTextTheme = TextTheme(
    displayLarge: _style(fontSize: 56, fontWeight: FontWeight.w800, color: AppColors.darkOnSurface, height: 1.05, letterSpacing: -1.1),
    headlineLarge: _style(fontSize: 32, fontWeight: FontWeight.w700, color: AppColors.darkOnSurface, height: 1.15, letterSpacing: -0.5),
    headlineMedium: _style(fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.darkOnSurface, height: 1.2, letterSpacing: -0.5),
    headlineSmall: _style(fontSize: 24, fontWeight: FontWeight.w600, color: AppColors.darkOnSurface, height: 1.25, letterSpacing: -0.3),
    titleLarge: _style(fontSize: 22, fontWeight: FontWeight.w600, color: AppColors.darkOnSurface, height: 1.3),
    titleMedium: _style(fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.darkOnSurface, height: 1.3),
    titleSmall: _style(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.darkOnSurface, height: 1.35),
    bodyLarge: _style(fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.darkOnSurface, height: 1.5),
    bodyMedium: _style(fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.darkOnSurfaceVariant, height: 1.45),
    bodySmall: _style(fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.darkOnSurfaceVariant, height: 1.4),
    labelSmall: _style(fontSize: 11, fontWeight: FontWeight.w500, color: AppColors.darkOnSurfaceVariant, height: 1.35),
  );

  static TextStyle _style({
    required double fontSize,
    required FontWeight fontWeight,
    required Color color,
    required double height,
    double? letterSpacing,
  }) => GoogleFonts.plusJakartaSans(fontSize: fontSize, fontWeight: fontWeight, color: color, height: height, letterSpacing: letterSpacing);
}
