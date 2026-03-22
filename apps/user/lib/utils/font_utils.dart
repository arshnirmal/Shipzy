// lib/utils/font_utils.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FontUtils {
  static TextStyle getPlusJakartaSans({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    double? height,
    double? letterSpacing,
    TextDecoration? decoration,
  }) {
    try {
      return GoogleFonts.plusJakartaSans(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
        letterSpacing: letterSpacing,
        decoration: decoration,
      );
    } catch (e) {
      // Fallback to system font if Google Fonts fails
      return TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        height: height,
        letterSpacing: letterSpacing,
        decoration: decoration,
        fontFamily: 'system-ui',
      );
    }
  }

  static TextStyle get buttonText => getPlusJakartaSans(fontWeight: FontWeight.w500);
}
