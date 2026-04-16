import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../theme/driver_app_theme.dart';
import '../../utils/app_routes.dart';

const String _kHasSeenOnboarding = 'has_seen_onboarding';
const String _kSkipLabel = 'Skip';
const String _kNextLabel = 'Continue';
const String _kGetStartedLabel = 'Get Started';

const double _kPageHorizontalPadding = DriverAppTheme.overlayBreathingMargin;
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
    final theme = Theme.of(context);
    final colorScheme = Theme.of(context).colorScheme;
    final isDark = theme.brightness == Brightness.dark;
    final gradient = isDark ? DriverAppTheme.primaryGradientDark : DriverAppTheme.primaryGradientLight;
    final ctaShadow = isDark ? DriverAppTheme.ambientShadowDark : DriverAppTheme.ambientShadowLight;

    return DecoratedBox(
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), gradient: gradient, boxShadow: [ctaShadow]),
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
              borderRadius: BorderRadius.circular(8),
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

class _ScheduleIllustration extends StatefulWidget {
  const _ScheduleIllustration();

  @override
  State<_ScheduleIllustration> createState() => _ScheduleIllustrationState();
}

class _ScheduleIllustrationState extends State<_ScheduleIllustration> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 700))..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final toggleProgress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.45, curve: Curves.easeOut),
    );
    final chipOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.18, 0.75, curve: Curves.easeOut),
    );
    final chipSlide = Tween<double>(begin: 10, end: 0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.18, 0.78, curve: Curves.easeOutCubic),
      ),
    );

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size.square(300),
            painter: _ConcentricBackgroundPainter(color: colorScheme.primary),
          ),
          Container(
            width: 210,
            height: 104,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [BoxShadow(color: colorScheme.shadow.withValues(alpha: 0.1), blurRadius: 24, offset: const Offset(0, 12))],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'OFFLINE   ON DUTY',
                  style: Theme.of(
                    context,
                  ).textTheme.labelSmall?.copyWith(color: colorScheme.onSurfaceVariant, letterSpacing: 0.6, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 10),
                Stack(
                  alignment: Alignment.centerLeft,
                  children: [
                    Container(
                      height: 14,
                      decoration: BoxDecoration(color: colorScheme.primary.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(999)),
                    ),
                    Align(
                      alignment: Alignment.lerp(Alignment.centerLeft, Alignment.centerRight, toggleProgress.value)!,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: colorScheme.primary,
                          shape: BoxShape.circle,
                          boxShadow: [BoxShadow(color: colorScheme.primary.withValues(alpha: 0.28), blurRadius: 12, offset: const Offset(0, 4))],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Positioned(
            right: 26,
            top: 36 - chipSlide.value,
            child: Opacity(
              opacity: chipOpacity.value,
              child: _InfoChip(
                icon: Icons.payments_rounded,
                text: '\$4,280',
                backgroundColor: colorScheme.tertiaryContainer,
                foregroundColor: colorScheme.onTertiaryContainer,
              ),
            ),
          ),
          Positioned(
            left: 18,
            bottom: 40,
            child: Opacity(
              opacity: chipOpacity.value,
              child: _InfoChip(
                icon: Icons.schedule_rounded,
                text: 'Flexible hours',
                backgroundColor: colorScheme.surface,
                foregroundColor: colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavigationIllustration extends StatefulWidget {
  const _NavigationIllustration();

  @override
  State<_NavigationIllustration> createState() => _NavigationIllustrationState();
}

class _NavigationIllustrationState extends State<_NavigationIllustration> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 820))..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final pathProgress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.65, curve: Curves.easeOut),
    );
    final etaSlide = Tween<double>(begin: -12, end: 0).animate(
      CurvedAnimation(
        parent: _controller,
        curve: const Interval(0.45, 0.92, curve: Curves.easeOutCubic),
      ),
    );
    final etaOpacity = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0.5, 0.96, curve: Curves.easeOut),
    );

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) => Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: const Size.square(300),
            painter: _DottedBackdropPainter(color: colorScheme.onSurface),
          ),
          Container(
            width: 238,
            height: 212,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              color: colorScheme.surfaceContainerHigh,
              boxShadow: [BoxShadow(color: colorScheme.shadow.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 10))],
            ),
            child: CustomPaint(
              painter: _RoutePainter(color: colorScheme.primary, progress: pathProgress.value),
            ),
          ),
          Positioned(
            left: 54,
            top: 118,
            child: _MapPin(color: colorScheme.primary, icon: Icons.inventory_2_rounded),
          ),
          Positioned(
            right: 54,
            top: 58,
            child: _MapPin(color: colorScheme.tertiary, icon: Icons.home_rounded),
          ),
          Positioned(
            top: 22 + etaSlide.value,
            child: Opacity(
              opacity: etaOpacity.value,
              child: _InfoChip(
                icon: Icons.route_rounded,
                text: '2.4 km  8 min',
                backgroundColor: colorScheme.surface,
                foregroundColor: colorScheme.onSurface,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PayoutIllustration extends StatefulWidget {
  const _PayoutIllustration();

  @override
  State<_PayoutIllustration> createState() => _PayoutIllustrationState();
}

class _PayoutIllustrationState extends State<_PayoutIllustration> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final countProgress = CurvedAnimation(
      parent: _controller,
      curve: const Interval(0, 0.68, curve: Curves.easeOut),
    );
    final pulse =
        TweenSequence<double>([
          TweenSequenceItem(tween: Tween<double>(begin: 1, end: 1.04).chain(CurveTween(curve: Curves.easeOut)), weight: 50),
          TweenSequenceItem(tween: Tween<double>(begin: 1.04, end: 1).chain(CurveTween(curve: Curves.easeInOut)), weight: 50),
        ]).animate(
          CurvedAnimation(
            parent: _controller,
            curve: const Interval(0.64, 1, curve: Curves.easeInOut),
          ),
        );

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final amount = (4280 * countProgress.value).round();

        return Stack(
          alignment: Alignment.center,
          children: [
            DecoratedBox(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  begin: Alignment.bottomLeft,
                  end: Alignment.topRight,
                  colors: [colorScheme.primary.withValues(alpha: 0.12), colorScheme.primaryContainer.withValues(alpha: 0.06)],
                ),
              ),
              child: const SizedBox(width: 280, height: 280),
            ),
            Container(
              width: 230,
              padding: const EdgeInsets.fromLTRB(18, 18, 18, 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                color: colorScheme.surfaceContainerHigh,
                boxShadow: [BoxShadow(color: colorScheme.shadow.withValues(alpha: 0.1), blurRadius: 20, offset: const Offset(0, 12))],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Today', style: Theme.of(context).textTheme.labelMedium?.copyWith(color: colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 2),
                  Text(
                    '\$${amount.toString()}',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(color: colorScheme.primary, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Text('16 deliveries  8h online', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 14),
                  Center(
                    child: Transform.scale(
                      scale: pulse.value,
                      child: Container(
                        width: 160,
                        height: 40,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(999),
                          gradient: LinearGradient(colors: [colorScheme.primary, colorScheme.primaryContainer]),
                        ),
                        child: Center(
                          child: Text(
                            'Withdraw',
                            style: Theme.of(context).textTheme.labelLarge?.copyWith(color: colorScheme.onPrimary, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Positioned(
              top: 36,
              right: 30,
              child: _InfoChip(
                icon: Icons.bolt_rounded,
                text: 'Daily',
                backgroundColor: colorScheme.tertiaryContainer,
                foregroundColor: colorScheme.onTertiaryContainer,
              ),
            ),
          ],
        );
      },
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.text, required this.backgroundColor, required this.foregroundColor});

  final IconData icon;
  final String text;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    decoration: BoxDecoration(
      color: backgroundColor,
      borderRadius: BorderRadius.circular(999),
      boxShadow: [BoxShadow(color: Theme.of(context).colorScheme.shadow.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, 4))],
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: foregroundColor),
        const SizedBox(width: 4),
        Text(
          text,
          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: foregroundColor, fontWeight: FontWeight.w700, letterSpacing: 0.2),
        ),
      ],
    ),
  );
}

class _MapPin extends StatelessWidget {
  const _MapPin({required this.color, required this.icon});

  final Color color;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Container(
    width: 30,
    height: 30,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    child: Icon(icon, size: 16, color: Theme.of(context).colorScheme.onPrimary),
  );
}

class _ConcentricBackgroundPainter extends CustomPainter {
  const _ConcentricBackgroundPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radialPaint = Paint()
      ..shader = RadialGradient(
        colors: [color.withValues(alpha: 0.1), color.withValues(alpha: 0.02)],
      ).createShader(Rect.fromCircle(center: center, radius: size.width / 2));

    canvas.drawCircle(center, size.width / 2, radialPaint);

    final ringPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..color = color.withValues(alpha: 0.12);
    canvas.drawCircle(center, size.width * 0.35, ringPaint);
    canvas.drawCircle(center, size.width * 0.46, ringPaint..color = color.withValues(alpha: 0.08));
  }

  @override
  bool shouldRepaint(covariant _ConcentricBackgroundPainter oldDelegate) => oldDelegate.color != color;
}

class _DottedBackdropPainter extends CustomPainter {
  const _DottedBackdropPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final dotPaint = Paint()..color = color.withValues(alpha: 0.03);

    for (double y = 22; y < size.height; y += 18) {
      for (double x = 18; x < size.width; x += 18) {
        canvas.drawCircle(Offset(x, y), 1.2, dotPaint);
      }
    }

    final vignettePaint = Paint()
      ..shader = RadialGradient(radius: 0.9, colors: [Colors.transparent, color.withValues(alpha: 0.06)]).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, vignettePaint);
  }

  @override
  bool shouldRepaint(covariant _DottedBackdropPainter oldDelegate) => oldDelegate.color != color;
}

class _RoutePainter extends CustomPainter {
  const _RoutePainter({required this.color, required this.progress});

  final Color color;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width * 0.2, size.height * 0.78)
      ..cubicTo(size.width * 0.38, size.height * 0.22, size.width * 0.64, size.height * 0.9, size.width * 0.82, size.height * 0.25);

    final dashedPaint = Paint()
      ..color = color.withValues(alpha: 0.34)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final activePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4
      ..strokeCap = StrokeCap.round;

    for (final metric in path.computeMetrics()) {
      const dashLength = 8.0;
      const gapLength = 8.0;
      double distance = 0;

      while (distance < metric.length) {
        final next = (distance + dashLength).clamp(0, metric.length).toDouble();
        canvas.drawPath(metric.extractPath(distance, next), dashedPaint);
        distance += dashLength + gapLength;
      }

      final visibleLength = (metric.length * progress).clamp(0, metric.length).toDouble();
      canvas.drawPath(metric.extractPath(0, visibleLength), activePaint);
      final tangent = metric.getTangentForOffset(visibleLength);
      if (tangent != null) {
        canvas.drawCircle(tangent.position, 4.5, Paint()..color = color);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _RoutePainter oldDelegate) => oldDelegate.color != color || oldDelegate.progress != progress;
}
