// lib/utils/font_utils.dart

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FontUtils {
  static TextStyle getPlusJakartaSans({
    double? fontSize,
    FontWeight? fontWeight,
    Color? color,
    TextDecoration? decoration,
  }) {
    try {
      return GoogleFonts.plusJakartaSans(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        decoration: decoration,
      );
    } catch (e) {
      // Fallback to system font if Google Fonts fails
      return TextStyle(
        fontSize: fontSize,
        fontWeight: fontWeight,
        color: color,
        decoration: decoration,
        fontFamily: 'system-ui',
      );
    }
  }
}
