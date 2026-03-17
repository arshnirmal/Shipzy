import 'package:flutter/material.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const primaryColor = Color(0xFF137FEC);
    final bgColor = isDark ? const Color(0xFF101922) : const Color(0xFFF6F7F8);
    final textColor = isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);
    final subtitleColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: bgColor,
      body: Stack(
        children: [
          // Background Decor
          Positioned.fill(
            child: Opacity(
              opacity: isDark ? 0.1 : 0.05,
              child: Image.asset(
                'assets/images/splash_bg.png',
                fit: BoxFit.cover,
              ),
            ),
          ),
          
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Top spacer
                  const SizedBox(height: 48, width: double.infinity),

                  // Center Content
                  Column(
                    children: [
                      // Stylized Icon Container
                      Container(
                        width: 96,
                        height: 96,
                        decoration: BoxDecoration(
                          color: primaryColor.withValues(alpha: isDark ? 0.2 : 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Transform.rotate(
                              angle: 0.1, // subtle rotation
                              child: Container(
                                decoration: BoxDecoration(
                                  color: primaryColor.withValues(alpha: 0.05),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.bolt,
                              size: 60,
                              color: primaryColor,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Brand Name and Tagline
                      Text(
                        'Shipzy',
                        style: TextStyle(
                          color: textColor,
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Fast local delivery',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 18,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),

                  // Bottom Content
                  Column(
                    children: [
                      // Loading section
                      SizedBox(
                        width: 40,
                        height: 40,
                        child: CircularProgressIndicator(
                          color: primaryColor,
                          strokeWidth: 2,
                          backgroundColor: primaryColor.withValues(alpha: 0.2),
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        'INITIALIZING...',
                        style: TextStyle(
                          color: subtitleColor,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 24),
                      // Progress Bar
                      Container(
                        width: 160,
                        height: 4,
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF1E293B) : const Color(0xFFE2E8F0),
                          borderRadius: BorderRadius.circular(2),
                        ),
                        alignment: Alignment.centerLeft,
                        child: FractionallySizedBox(
                          widthFactor: 0.33,
                          child: Container(
                            decoration: BoxDecoration(
                              color: primaryColor,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 48),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
