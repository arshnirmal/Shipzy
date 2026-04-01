// lib/screens/splash_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/design_tokens.dart';

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
    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
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
                color: Theme.of(context).colorScheme.surfaceContainerLowest,
                borderRadius: AppRadius.radiusLg,
                boxShadow: AppDepth.ambientShadow(Theme.of(context).brightness),
              ),
              child: SvgPicture.asset('assets/app_logo.svg', width: 32, height: 32),
            ),

            const SizedBox(height: AppSpacing.lg),

            // Brand name
            Text(
              'Shipzy',
              style: Theme.of(
                context,
              ).textTheme.displayLarge?.copyWith(fontSize: 62, color: Theme.of(context).colorScheme.primary, letterSpacing: -1.2),
            ),

            const SizedBox(height: AppSpacing.md),

            // Tagline
            Text('Fast local delivery', style: Theme.of(context).textTheme.bodyLarge),

            const SizedBox(height: AppSpacing.xxl),

            // Loading indicator
            SizedBox(
              width: 28,
              height: 28,
              child: CircularProgressIndicator(
                strokeWidth: 1.5,
                valueColor: AlwaysStoppedAnimation<Color>(Theme.of(context).colorScheme.primary),
                backgroundColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.2),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
