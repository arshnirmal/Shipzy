import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../utils/app_routes.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPageIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPageIndex < 2) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('has_seen_onboarding', true);
    if (!mounted) {
      return;
    }
    context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Extracted Tailwind Colors
    const primaryColor = Color(0xFF137FEC);
    final bgColor = isDark ? const Color(0xFF101922) : const Color(0xFFF6F7F8);
    final surfaceColor = isDark ? const Color(0xFF1E293B) : Colors.white; // Slate 800 vs White
    final textColor = isDark ? const Color(0xFFF1F5F9) : const Color(0xFF0F172A);
    final subtitleColor = isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B);

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // Top Nav / Skip Button
            Padding(
              padding: const EdgeInsets.only(top: 8, right: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (_currentPageIndex < 2)
                    TextButton(
                      onPressed: _finishOnboarding,
                      style: TextButton.styleFrom(
                        foregroundColor: subtitleColor,
                        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                      ),
                      child: const Text('Skip'),
                    )
                  else
                    const SizedBox(height: 48), // Spacer to maintain consistent layout
                ],
              ),
            ),

            // Expanded PageView
            Expanded(
              child: PageView(
                controller: _pageController,
                physics: const BouncingScrollPhysics(),
                onPageChanged: (index) {
                  setState(() {
                    _currentPageIndex = index;
                  });
                },
                children: [
                  // Step 1: Browse
                  _buildPage(
                    imagePath: 'assets/images/onboarding/step1.png',
                    title: 'Book a Fast Courier',
                    subtitle: 'Send anything across town instantly or schedule a delivery for later.',
                    isDark: isDark,
                    surfaceColor: surfaceColor,
                    textColor: textColor,
                    subtitleColor: subtitleColor,
                    imageBgDecoration: BoxDecoration(
                      color: surfaceColor,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [if (!isDark) BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, 4))],
                    ),
                    paddingTop: 16,
                    marginHorizontal: 16,
                    useImageDecoration: true,
                  ),

                  // Step 2: Delivery
                  _buildPage(
                    imagePath: 'assets/images/onboarding/step2.png',
                    title: 'Fastest Delivery',
                    subtitle: 'Our fleet of local riders ensures your order reaches you in record time.',
                    isDark: isDark,
                    surfaceColor: surfaceColor,
                    textColor: textColor,
                    subtitleColor: subtitleColor,
                    imageBgDecoration: BoxDecoration(
                      color: primaryColor.withValues(alpha: isDark ? 0.2 : 0.1),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    paddingTop: 40,
                    marginHorizontal: 32,
                    useImageDecoration: false,
                    imageSquare: true,
                  ),

                  // Step 3: Get Started
                  _buildPage(
                    imagePath: 'assets/images/onboarding/step3.png',
                    title: 'Get Started with Shipzy',
                    subtitle: 'Join thousands of locals getting everything they need delivered fast.',
                    isDark: isDark,
                    surfaceColor: surfaceColor,
                    textColor: textColor,
                    subtitleColor: subtitleColor,
                    imageBgDecoration: BoxDecoration(
                      color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9), // Slate 800 / Slate 100
                      borderRadius: BorderRadius.circular(12),
                    ),
                    paddingTop: 16,
                    marginHorizontal: 16,
                    useImageDecoration: false,
                    imageSquare: true,
                  ),
                ],
              ),
            ),

            // Bottom Navigation & Actions
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Progress Indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      3,
                      (index) => AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        height: 8,
                        width: _currentPageIndex == index ? 32 : 8,
                        decoration: BoxDecoration(
                          color: _currentPageIndex == index
                              ? primaryColor
                              : (isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1)), // Slate 700 / Slate 300
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 32),

                  // Action Buttons based on page
                  if (_currentPageIndex < 2) _buildNextButton(primaryColor) else _buildGetStartedButtons(primaryColor),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNextButton(Color primaryColor) => SizedBox(
    width: double.infinity,
    height: 56,
    child: ElevatedButton(
      onPressed: _onNext,
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 4,
        shadowColor: primaryColor.withValues(alpha: 0.25),
      ),
      child: const Text('Next', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
    ),
  );

  Widget _buildGetStartedButtons(Color primaryColor) => Column(
    children: [
      SizedBox(
        width: double.infinity,
        height: 56,
        child: ElevatedButton(
          onPressed: _finishOnboarding,
          style: ElevatedButton.styleFrom(
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            elevation: 2,
          ),
          child: const Text('Get Started', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        ),
      ),
      const SizedBox(height: 24),
      Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Already have an account?',
            style: TextStyle(
              color: Theme.of(context).brightness == Brightness.dark ? const Color(0xFF94A3B8) : const Color(0xFF475569),
              fontSize: 14,
            ),
          ),
          TextButton(
            onPressed: _finishOnboarding,
            style: TextButton.styleFrom(
              foregroundColor: primaryColor,
              textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
            child: const Text('Sign In'),
          ),
        ],
      ),
    ],
  );

  Widget _buildPage({
    required String imagePath,
    required String title,
    required String subtitle,
    required bool isDark,
    required Color surfaceColor,
    required Color textColor,
    required Color subtitleColor,
    required BoxDecoration imageBgDecoration,
    required double paddingTop,
    required double marginHorizontal,
    required bool useImageDecoration,
    bool imageSquare = false,
  }) => Column(
    children: [
      Expanded(
        flex: 5,
        child: Padding(
          padding: EdgeInsets.only(top: paddingTop, left: marginHorizontal, right: marginHorizontal),
          child: Container(
            width: double.infinity,
            decoration: imageBgDecoration,
            clipBehavior: Clip.antiAlias,
            child: Stack(
              fit: StackFit.expand,
              children: [
                Align(
                  alignment: imageSquare ? Alignment.center : Alignment.topCenter,
                  child: imageSquare
                      ? ConstrainedBox(
                          constraints: const BoxConstraints(maxWidth: 280, maxHeight: 280),
                          child: Image.asset(imagePath, fit: BoxFit.cover),
                        )
                      : Image.asset(imagePath, fit: BoxFit.cover),
                ),
                if (useImageDecoration)
                  Positioned.fill(
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [Colors.black.withValues(alpha: 0.2), Colors.transparent],
                          stops: const [0.0, 0.4],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
      Expanded(
        flex: 3,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(32, 32, 32, 0),
          child: Column(
            children: [
              Text(
                title,
                textAlign: TextAlign.center,
                style: TextStyle(color: textColor, fontSize: 32, fontWeight: FontWeight.bold, letterSpacing: -0.5, height: 1.2),
              ),
              const SizedBox(height: 16),
              Text(
                subtitle,
                textAlign: TextAlign.center,
                style: TextStyle(color: subtitleColor, fontSize: 16, fontWeight: FontWeight.w500, height: 1.5),
              ),
            ],
          ),
        ),
      ),
    ],
  );
}
