import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../utils/app_routes.dart';

const String _kHasSeenOnboarding = 'has_seen_onboarding';
const String _kSkipLabel = 'Skip';
const String _kNextLabel = 'Next';
const String _kGetStartedLabel = 'Get Started';

const double _kPageHorizontalPadding = 24;
const double _kPrimaryButtonHeight = 56;

enum _OnboardingIllustrationType { schedule, navigation, payouts }

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();

  static const List<_OnboardingPageData> _pages = [
    _OnboardingPageData(
      type: _OnboardingIllustrationType.schedule,
      title: 'Earn on Your Terms',
      subtitle: 'Choose when and where you want to work. Be your own boss with flexible schedules.',
    ),
    _OnboardingPageData(
      type: _OnboardingIllustrationType.navigation,
      title: 'Seamless Navigation',
      subtitle: 'Our smart routing helps you find the fastest paths and delivery points with ease.',
    ),
    _OnboardingPageData(
      type: _OnboardingIllustrationType.payouts,
      title: 'Instant Payouts',
      subtitle: 'Get paid daily. Track your earnings in real-time and withdraw whenever you need.',
    ),
  ];

  int _currentPageIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _onNext() {
    if (_currentPageIndex < _pages.length - 1) {
      _pageController.nextPage(duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
    } else {
      _finishOnboarding();
    }
  }

  Future<void> _finishOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_kHasSeenOnboarding, true);
    if (!mounted) {
      return;
    }
    context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _OnboardingTopBar(showSkip: _currentPageIndex < _pages.length - 1, onSkip: _finishOnboarding),
            Expanded(
              child: Semantics(
                label: 'Onboarding step ${_currentPageIndex + 1} of ${_pages.length}',
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _pages.length,
                  onPageChanged: (value) => setState(() => _currentPageIndex = value),
                  itemBuilder: (context, index) {
                    final page = _pages[index];
                    return _OnboardingPageBody(page: page);
                  },
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(_kPageHorizontalPadding, 16, _kPageHorizontalPadding, 24),
              child: _OnboardingBottomActions(
                pageCount: _pages.length,
                currentIndex: _currentPageIndex,
                primaryLabel: _currentPageIndex == _pages.length - 1 ? _kGetStartedLabel : _kNextLabel,
                showNextArrow: _currentPageIndex < _pages.length - 1,
                onPrimary: _onNext,
                activeDotColor: colorScheme.primary,
                inactiveDotColor: colorScheme.outlineVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPageData {
  const _OnboardingPageData({required this.type, required this.title, required this.subtitle});

  final _OnboardingIllustrationType type;
  final String title;
  final String subtitle;
}

class _OnboardingTopBar extends StatelessWidget {
  const _OnboardingTopBar({required this.showSkip, required this.onSkip});

  final bool showSkip;
  final VoidCallback onSkip;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: _kPageHorizontalPadding, vertical: 8),
    child: Row(
      children: [
        const Spacer(),
        Visibility(
          visible: showSkip,
          maintainState: true,
          maintainAnimation: true,
          maintainSize: true,
          child: TextButton(onPressed: onSkip, child: const Text(_kSkipLabel)),
        ),
      ],
    ),
  );
}

class _OnboardingPageBody extends StatelessWidget {
  const _OnboardingPageBody({required this.page});

  final _OnboardingPageData page;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final isCompact = screenWidth < 380;
    final illustrationSize = isCompact ? 280.0 : 320.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: _kPageHorizontalPadding),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: illustrationSize,
            child: AspectRatio(aspectRatio: 1, child: _OnboardingHeroIllustration(type: page.type)),
          ),
          SizedBox(height: isCompact ? 28 : 36),
          Text(
            page.title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.headlineMedium?.copyWith(color: colorScheme.onSurface, fontWeight: FontWeight.w700, height: 1.2),
          ),
          const SizedBox(height: 12),
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant, height: 1.45),
          ),
        ],
      ),
    );
  }
}

class _OnboardingBottomActions extends StatelessWidget {
  const _OnboardingBottomActions({
    required this.pageCount,
    required this.currentIndex,
    required this.primaryLabel,
    required this.showNextArrow,
    required this.onPrimary,
    required this.activeDotColor,
    required this.inactiveDotColor,
  });

  final int pageCount;
  final int currentIndex;
  final String primaryLabel;
  final bool showNextArrow;
  final VoidCallback onPrimary;
  final Color activeDotColor;
  final Color inactiveDotColor;

  @override
  Widget build(BuildContext context) => Column(
    mainAxisSize: MainAxisSize.min,
    crossAxisAlignment: CrossAxisAlignment.stretch,
    children: [
      _OnboardingProgressDots(pageCount: pageCount, currentIndex: currentIndex, activeColor: activeDotColor, inactiveColor: inactiveDotColor),
      const SizedBox(height: 20),
      _OnboardingPrimaryCta(label: primaryLabel, showArrow: showNextArrow, onPressed: onPrimary),
    ],
  );
}

class _OnboardingProgressDots extends StatelessWidget {
  const _OnboardingProgressDots({required this.pageCount, required this.currentIndex, required this.activeColor, required this.inactiveColor});

  final int pageCount;
  final int currentIndex;
  final Color activeColor;
  final Color inactiveColor;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(pageCount, (index) {
      final isActive = index == currentIndex;
      return AnimatedContainer(
        duration: const Duration(milliseconds: 220),
        curve: Curves.easeOutCubic,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        width: isActive ? 30 : 10,
        height: 10,
        decoration: BoxDecoration(color: isActive ? activeColor : inactiveColor, borderRadius: BorderRadius.circular(99)),
      );
    }),
  );
}

class _OnboardingPrimaryCta extends StatelessWidget {
  const _OnboardingPrimaryCta({required this.label, required this.onPressed, this.showArrow = false});

  final String label;
  final VoidCallback onPressed;
  final bool showArrow;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return DecoratedBox(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [colorScheme.primary, colorScheme.secondary]),
        boxShadow: [BoxShadow(color: colorScheme.primary.withValues(alpha: 0.22), blurRadius: 14, offset: const Offset(0, 8))],
      ),
      child: SizedBox(
        width: double.infinity,
        height: _kPrimaryButtonHeight,
        child: Material(
          color: Colors.transparent,
          child: Semantics(
            button: true,
            label: label,
            child: InkWell(
              onTap: onPressed,
              borderRadius: BorderRadius.circular(16),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      label,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(color: colorScheme.onPrimary, fontWeight: FontWeight.w700),
                    ),
                    if (showArrow) ...[const SizedBox(width: 6), Icon(Icons.arrow_forward_rounded, color: colorScheme.onPrimary, size: 18)],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _OnboardingHeroIllustration extends StatelessWidget {
  const _OnboardingHeroIllustration({required this.type});

  final _OnboardingIllustrationType type;

  @override
  Widget build(BuildContext context) {
    switch (type) {
      case _OnboardingIllustrationType.schedule:
        return const _ScheduleIllustration();
      case _OnboardingIllustrationType.navigation:
        return const _NavigationIllustration();
      case _OnboardingIllustrationType.payouts:
        return const _PayoutIllustration();
    }
  }
}

class _ScheduleIllustration extends StatelessWidget {
  const _ScheduleIllustration();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 280,
          height: 280,
          decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Container(
          width: 210,
          height: 210,
          decoration: BoxDecoration(
            color: colorScheme.surface,
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: colorScheme.onSurface.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 10))],
            border: Border.all(color: colorScheme.primary.withValues(alpha: 0.15), width: 2),
          ),
          child: Center(
            child: Container(
              width: 104,
              height: 104,
              decoration: BoxDecoration(
                color: colorScheme.primary,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [BoxShadow(color: colorScheme.primary.withValues(alpha: 0.28), blurRadius: 16, offset: const Offset(0, 8))],
              ),
              child: Icon(Icons.schedule_rounded, color: colorScheme.onPrimary, size: 52),
            ),
          ),
        ),
        Positioned(
          top: 72,
          right: 54,
          child: _FloatingTag(icon: Icons.work_outline_rounded, text: 'Flexible', color: colorScheme.secondary),
        ),
      ],
    );
  }
}

class _NavigationIllustration extends StatelessWidget {
  const _NavigationIllustration();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 280,
          height: 280,
          decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Container(
          width: 224,
          height: 224,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(28),
            color: colorScheme.surface,
            boxShadow: [BoxShadow(color: colorScheme.onSurface.withValues(alpha: 0.08), blurRadius: 18, offset: const Offset(0, 8))],
            border: Border.all(color: colorScheme.primary.withValues(alpha: 0.16), width: 1.5),
          ),
          child: CustomPaint(painter: _RoutePainter(color: colorScheme.primary)),
        ),
        Positioned(
          bottom: 54,
          child: Container(
            width: 88,
            height: 88,
            decoration: BoxDecoration(
              color: colorScheme.primary,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: colorScheme.primary.withValues(alpha: 0.28), blurRadius: 16, offset: const Offset(0, 8))],
            ),
            child: Icon(Icons.navigation_rounded, color: colorScheme.onPrimary, size: 44),
          ),
        ),
      ],
    );
  }
}

class _PayoutIllustration extends StatelessWidget {
  const _PayoutIllustration();

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Stack(
      alignment: Alignment.center,
      children: [
        Container(
          width: 280,
          height: 280,
          decoration: BoxDecoration(shape: BoxShape.circle, color: colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Container(
          width: 168,
          height: 168,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: colorScheme.surface,
            border: Border.all(color: colorScheme.primary.withValues(alpha: 0.15), width: 2),
            boxShadow: [BoxShadow(color: colorScheme.onSurface.withValues(alpha: 0.08), blurRadius: 20, offset: const Offset(0, 10))],
          ),
          child: Center(
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: colorScheme.primary,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [BoxShadow(color: colorScheme.primary.withValues(alpha: 0.28), blurRadius: 16, offset: const Offset(0, 8))],
              ),
              child: Icon(Icons.payments_rounded, color: colorScheme.onPrimary, size: 50),
            ),
          ),
        ),
        Positioned(
          top: 70,
          left: 58,
          child: _FloatingTag(icon: Icons.bolt_rounded, text: 'Daily', color: colorScheme.tertiary),
        ),
      ],
    );
  }
}

class _FloatingTag extends StatelessWidget {
  const _FloatingTag({required this.icon, required this.text, required this.color});

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: BorderRadius.circular(99),
        boxShadow: [BoxShadow(color: colorScheme.onSurface.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 4),
          Text(text, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700, letterSpacing: 0.3)),
        ],
      ),
    );
  }
}

class _RoutePainter extends CustomPainter {
  const _RoutePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width * 0.2, size.height * 0.82)
      ..cubicTo(size.width * 0.35, size.height * 0.22, size.width * 0.72, size.height * 0.9, size.width * 0.84, size.height * 0.28);

    final basePaint = Paint()
      ..color = color.withValues(alpha: 0.2)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    canvas.drawPath(path, basePaint);

    for (final metric in path.computeMetrics()) {
      final activeEnd = metric.length * 0.58;
      canvas.drawPath(metric.extractPath(0, activeEnd), activePaint);
      final endTangent = metric.getTangentForOffset(activeEnd);
      if (endTangent != null) {
        canvas.drawCircle(endTangent.position, 5, Paint()..color = color);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _RoutePainter oldDelegate) => oldDelegate.color != color;
}
