// lib/screens/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:google_fonts/google_fonts.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToHome();
  }

  @override
  void dispose() {
    super.dispose();
  }

  void _navigateToHome() async {
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      // Navigation is handled by GoRouter redirect logic in app_router.dart
      // No need to manually navigate here
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: const Color(0xFFfcfcfc),
    body: SafeArea(
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo container
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 30, offset: const Offset(0, 8))],
                border: Border.all(color: const Color(0xFFf1f5f9)),
              ),
              child: SvgPicture.asset('assets/app_logo.svg', width: 32, height: 32),
            ),

            const SizedBox(height: 24),

            // Brand name
            Text(
              'Shipzy',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 42,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF6366F1),
                letterSpacing: -1.05,
                height: 1,
              ),
            ),

            const SizedBox(height: 16),

            // Tagline
            Text(
              'Fast local delivery',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: const Color(0xFF64748B),
                letterSpacing: 0.375,
                height: 1,
              ),
            ),

            const SizedBox(height: 48),

            // Loading indicator
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF6366F1)),
                backgroundColor: const Color(0xFF6366F1).withValues(alpha: 0.2),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
