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
              children: [if (_currentPageIndex == 1) TextButton(onPressed: _finishOnboarding, child: const Text('Skip'))],
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
                      SizedBox(
                        width: 320,
                        child: AspectRatio(
                          aspectRatio: 48 / 41,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(24),
                            child: Image.asset(page.imagePath, fit: BoxFit.cover),
                          ),
                        ),
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
                      width: isActive ? 32 : 10,
                      height: 10,
                      decoration: BoxDecoration(
                        color: isActive ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.outlineVariant,
                        borderRadius: BorderRadius.circular(99),
                      ),
                    );
                  }),
                ),

                const SizedBox(height: AppSpacing.lg),

                if (_currentPageIndex == 0)
                  Row(
                    children: [
                      TextButton(onPressed: _finishOnboarding, child: const Text('Skip')),
                      const Spacer(),
                      _OnboardingCtaButton(label: 'Next', width: 120, onTap: _onNext),
                    ],
                  )
                else ...[
                  _OnboardingCtaButton(
                    label: _currentPageIndex == _pages.length - 1 ? 'Get Started' : 'Next',
                    width: double.infinity,
                    onTap: _onNext,
                    showArrow: _currentPageIndex == 1,
                  ),
                  if (_currentPageIndex == _pages.length - 1) ...[
                    const SizedBox(height: AppSpacing.md),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('Already have an account? ', style: Theme.of(context).textTheme.bodyMedium),
                        TextButton(onPressed: () => context.go(AppRoutes.login), child: const Text('Sign In')),
                      ],
                    ),
                  ],
                ],
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

class _OnboardingCtaButton extends StatelessWidget {
  const _OnboardingCtaButton({required this.label, required this.width, required this.onTap, this.showArrow = false});

  final String label;
  final double width;
  final VoidCallback onTap;
  final bool showArrow;

  @override
  Widget build(BuildContext context) => Container(
    decoration: BoxDecoration(
      borderRadius: AppRadius.radiusLg,
      gradient: AppGradients.primaryCta,
      boxShadow: AppDepth.ambientShadow(Theme.of(context).brightness),
    ),
    child: SizedBox(
      width: width,
      height: 56,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: AppRadius.radiusLg,
          child: Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 18),
                ),
                if (showArrow) ...[const SizedBox(width: AppSpacing.xs), const Icon(Icons.arrow_forward, color: Colors.white, size: 18)],
              ],
            ),
          ),
        ),
      ),
    ),
  );
}
