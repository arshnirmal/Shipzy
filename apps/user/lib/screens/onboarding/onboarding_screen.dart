import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../theme/design_tokens.dart';
import '../../utils/app_routes.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPageIndex = 0;

  static const _pages = [
    _OnboardingPageData(
      imagePath: 'assets/images/onboarding/step1.png',
      title: 'Book a Fast Courier',
      subtitle: 'Send anything across town instantly or schedule a delivery for later.',
    ),
    _OnboardingPageData(
      imagePath: 'assets/images/onboarding/step2.png',
      title: 'Fastest Delivery',
      subtitle: 'Our fleet of local riders ensures your order reaches you in record time.',
    ),
    _OnboardingPageData(
      imagePath: 'assets/images/onboarding/step3.png',
      title: 'Get Started with Shipzy',
      subtitle: 'Join thousands of locals getting everything they need delivered fast.',
    ),
  ];

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
  Widget build(BuildContext context) => Scaffold(
    backgroundColor: Theme.of(context).colorScheme.surfaceContainerLow,
    body: SafeArea(
      child: Column(
        children: [
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.md),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [if (_currentPageIndex < _pages.length - 1) TextButton(onPressed: _finishOnboarding, child: const Text('Skip'))],
            ),
          ),

          // Main content
          Expanded(
            child: PageView.builder(
              controller: _pageController,
              itemCount: _pages.length,
              onPageChanged: (value) {
                setState(() {
                  _currentPageIndex = value;
                });
              },
              itemBuilder: (context, index) {
                final page = _pages[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      ClipRRect(
                        borderRadius: AppRadius.radiusLg,
                        child: Image.asset(page.imagePath, width: double.infinity, height: 260, fit: BoxFit.cover),
                      ),
                      const SizedBox(height: AppSpacing.xl),
                      Text(page.title, textAlign: TextAlign.center, style: Theme.of(context).textTheme.headlineMedium),
                      const SizedBox(height: AppSpacing.md),
                      Text(page.subtitle, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                );
              },
            ),
          ),

          // Bottom section
          Padding(
            padding: const EdgeInsets.all(AppSpacing.xl),
            child: Column(
              children: [
                // Progress indicators
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_pages.length, (index) {
                    final isActive = index == _currentPageIndex;
                    return AnimatedContainer(
                      duration: const Duration(milliseconds: 220),
                      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xxs),
                      width: isActive ? 18 : 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: isActive ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outlineVariant,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    );
                  }),
                ),

                const SizedBox(height: AppSpacing.lg),

                // Next button
                Container(
                  decoration: BoxDecoration(
                    borderRadius: AppRadius.radiusLg,
                    gradient: AppGradients.primaryCta,
                    boxShadow: AppDepth.ambientShadow(Theme.of(context).brightness),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: _onNext,
                        borderRadius: AppRadius.radiusLg,
                        child: Center(
                          child: Text(
                            _currentPageIndex == _pages.length - 1 ? 'Get Started' : 'Next',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w500),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _OnboardingPageData {
  const _OnboardingPageData({required this.imagePath, required this.title, required this.subtitle});

  final String imagePath;
  final String title;
  final String subtitle;
}
