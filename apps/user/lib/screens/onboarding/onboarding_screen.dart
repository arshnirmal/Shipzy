import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../theme/design_tokens.dart';
import '../../utils/app_routes.dart';

enum _OnboardingIllustrationType { courier, tracking, payments }

const double _heroOuterSize = 300;
const double _heroFloatingCardSize = 62;

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();

  static const _pages = [
    _OnboardingPageData(
      type: _OnboardingIllustrationType.courier,
      title: 'Book a Fast Courier',
      subtitle: 'Get your packages delivered quickly and safely across the city with our trusted hyperlocal delivery network.',
    ),
    _OnboardingPageData(
      type: _OnboardingIllustrationType.tracking,
      title: 'Real-time Tracking',
      subtitle: 'Stay updated with live tracking and receive instant notifications on your delivery progress.',
    ),
    _OnboardingPageData(
      type: _OnboardingIllustrationType.payments,
      title: 'Safe Package Handling',
      subtitle: 'Your parcels are handled with care through verified riders and secure handoff checkpoints.',
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
    await prefs.setBool('has_seen_onboarding', true);
    if (!mounted) {
      return;
    }
    context.go(AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
              padding: const EdgeInsets.fromLTRB(AppSpacing.xl, AppSpacing.md, AppSpacing.xl, AppSpacing.xl),
              child: _OnboardingBottomActions(
                pageCount: _pages.length,
                currentIndex: _currentPageIndex,
                primaryLabel: _currentPageIndex == _pages.length - 1 ? 'Get Started' : 'Next',
                showNextArrow: _currentPageIndex < _pages.length - 1,
                onPrimary: _onNext,
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
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
    child: Row(
      children: [
        const Spacer(),
        Visibility(
          visible: showSkip,
          maintainState: true,
          maintainAnimation: true,
          maintainSize: true,
          child: TextButton(onPressed: onSkip, child: const Text('Skip')),
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
    final illustrationSize = isCompact ? 288.0 : 320.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: illustrationSize,
            child: AspectRatio(aspectRatio: 1, child: _OnboardingHeroIllustration(type: page.type)),
          ),
          SizedBox(height: isCompact ? AppSpacing.lg : AppSpacing.xl),
          Text(
            page.title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.headlineMedium?.copyWith(color: colorScheme.onSurface),
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            page.subtitle,
            textAlign: TextAlign.center,
            maxLines: 5,
            overflow: TextOverflow.ellipsis,
            style: theme.textTheme.bodyMedium?.copyWith(color: colorScheme.onSurfaceVariant),
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
  });

  final int pageCount;
  final int currentIndex;
  final String primaryLabel;
  final bool showNextArrow;
  final VoidCallback onPrimary;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _OnboardingProgressDots(
          pageCount: pageCount,
          currentIndex: currentIndex,
          activeColor: colorScheme.primary,
          inactiveColor: colorScheme.outlineVariant,
        ),
        const SizedBox(height: AppSpacing.lg),
        _OnboardingPrimaryCta(label: primaryLabel, showArrow: showNextArrow, onPressed: onPrimary),
      ],
    );
  }
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
        margin: const EdgeInsets.symmetric(horizontal: AppSpacing.xxs),
        width: isActive ? 32 : 10,
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
  Widget build(BuildContext context) => DecoratedBox(
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
        child: Semantics(
          button: true,
          label: label,
          child: InkWell(
            onTap: onPressed,
            borderRadius: AppRadius.radiusLg,
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: Theme.of(
                      context,
                    ).textTheme.titleMedium?.copyWith(color: AppColors.onPrimaryCta, fontWeight: FontWeight.w600, fontSize: 18),
                  ),
                  if (showArrow) ...[
                    const SizedBox(width: AppSpacing.xs),
                    const ExcludeSemantics(child: Icon(Icons.arrow_forward, color: AppColors.onPrimaryCta, size: 18)),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    ),
  );
}

class _OnboardingHeroIllustration extends StatelessWidget {
  const _OnboardingHeroIllustration({required this.type});

  final _OnboardingIllustrationType type;

  @override
  Widget build(BuildContext context) {
    switch (type) {
      case _OnboardingIllustrationType.courier:
        return const _CourierIllustration();
      case _OnboardingIllustrationType.tracking:
        return const _TrackingIllustration();
      case _OnboardingIllustrationType.payments:
        return const _PaymentsIllustration();
    }
  }
}

class _CourierIllustration extends StatelessWidget {
  const _CourierIllustration();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCompact = MediaQuery.sizeOf(context).width < 380;

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Container(
          width: _heroOuterSize,
          height: _heroOuterSize,
          decoration: BoxDecoration(shape: BoxShape.circle, color: theme.colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Container(
          width: 244,
          height: 244,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: theme.colorScheme.surfaceContainerLowest,
            boxShadow: AppDepth.ambientShadow(theme.brightness),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: CustomPaint(painter: _CircularRoutePainter(color: theme.colorScheme.primary)),
          ),
        ),
        Container(
          width: 144,
          height: 144,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: theme.colorScheme.primary,
            boxShadow: [
              BoxShadow(color: theme.colorScheme.primary.withValues(alpha: 0.26), blurRadius: 20, offset: const Offset(0, 10)),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Container(
                width: 78,
                height: 78,
                decoration: BoxDecoration(
                  color: AppColors.onPrimaryCta.withValues(alpha: 0.16),
                  borderRadius: BorderRadius.circular(22),
                ),
                child: const Icon(Icons.two_wheeler_rounded, size: 44, color: AppColors.onPrimaryCta),
              ),
              Positioned(
                top: 30,
                right: 24,
                child: Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.onPrimaryCta,
                    borderRadius: BorderRadius.circular(9),
                    border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.22), width: 1.4),
                  ),
                  child: Icon(Icons.inventory_2_rounded, color: theme.colorScheme.primary, size: 16),
                ),
              ),
            ],
          ),
        ),
        Positioned(
          top: isCompact ? 58 : 52,
          right: isCompact ? 38 : 44,
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: _heroFloatingCardSize,
                height: _heroFloatingCardSize,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerLowest.withValues(alpha: 0.9),
                  borderRadius: BorderRadius.circular(18),
                  boxShadow: AppDepth.ambientShadow(theme.brightness),
                ),
                child: Icon(Icons.inventory_2_rounded, color: theme.colorScheme.primary, size: 30),
              ),
              Positioned(
                right: -6,
                bottom: -6,
                child: Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.colorScheme.surfaceContainerLowest, width: 1.8),
                  ),
                  child: const Icon(Icons.verified_user_rounded, color: AppColors.onPrimaryCta, size: 12),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _CircularRoutePainter extends CustomPainter {
  const _CircularRoutePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final dashed = Paint()
      ..color = color.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final solid = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromCircle(center: size.center(Offset.zero), radius: size.shortestSide * 0.36);
    const start = -2.5;
    const sweep = 4.6;

    canvas.drawArc(rect, start, sweep, false, dashed);
    canvas.drawArc(rect, start + 0.7, 1.8, false, solid);

    final endPoint = Offset(
      size.center(Offset.zero).dx + rect.width / 2 * 0.75,
      size.center(Offset.zero).dy - rect.height / 2 * 0.64,
    );

    canvas.drawCircle(endPoint, 5.5, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant _CircularRoutePainter oldDelegate) => oldDelegate.color != color;
}

class _TrackingIllustration extends StatelessWidget {
  const _TrackingIllustration();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCompact = MediaQuery.sizeOf(context).width < 380;

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Container(
          width: _heroOuterSize,
          height: _heroOuterSize,
          decoration: BoxDecoration(shape: BoxShape.circle, color: theme.colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Transform(
          alignment: Alignment.center,
          transform: Matrix4.identity()
            ..setEntry(3, 2, 0.0012)
            ..rotateX(0.52)
            ..rotateZ(-0.22),
          child: Container(
            width: 232,
            height: 232,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(28),
              border: Border.all(color: theme.colorScheme.surfaceContainerLow),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.06),
                  blurRadius: 16,
                  offset: const Offset(-8, 8),
                ),
              ],
            ),
            child: Stack(
              children: [
                Positioned(
                  top: 54,
                  left: 32,
                  child: SizedBox(
                    width: 164,
                    height: 90,
                    child: CustomPaint(painter: _RouteCurvePainter(color: theme.colorScheme.primary)),
                  ),
                ),
                Positioned(
                  top: 46,
                  left: 188,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      _PulseRing(color: theme.colorScheme.primary),
                      Container(
                        width: 16,
                        height: 16,
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primary,
                          shape: BoxShape.circle,
                          border: Border.all(color: theme.colorScheme.surfaceContainerLowest, width: 2),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          top: isCompact ? 46 : 42,
          left: isCompact ? 56 : 62,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: theme.colorScheme.surfaceContainerLow),
              boxShadow: AppDepth.ambientShadow(theme.brightness),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Stack(
                  alignment: Alignment.center,
                  children: [
                    _PulseRing(color: Colors.green.shade600, size: 14),
                    Container(
                      width: 7,
                      height: 7,
                      decoration: BoxDecoration(color: Colors.green.shade600, shape: BoxShape.circle),
                    ),
                  ],
                ),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'LIVE',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          bottom: isCompact ? 80 : 88,
          left: isCompact ? 42 : 48,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(14),
              boxShadow: AppDepth.ambientShadow(theme.brightness),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10)),
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.center,
                    children: [
                      Icon(Icons.two_wheeler, color: theme.colorScheme.primary, size: 19),
                      Positioned(
                        top: -2,
                        right: -2,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: theme.colorScheme.surfaceContainerLowest,
                            shape: BoxShape.circle,
                            border: Border.all(color: theme.colorScheme.surfaceContainerLow),
                          ),
                          child: Icon(Icons.location_on, size: 8, color: theme.colorScheme.primary),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Rider nearby',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurface,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'ETA 8 min',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _PaymentsIllustration extends StatelessWidget {
  const _PaymentsIllustration();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isCompact = MediaQuery.sizeOf(context).width < 380;
    final routeLeft = isCompact ? 42.0 : 46.0;
    final routeTop = isCompact ? 90.0 : 84.0;
    final routeWidth = isCompact ? 200.0 : 208.0;
    final routeHeight = isCompact ? 112.0 : 118.0;
    final chipHorizontalPadding = isCompact ? AppSpacing.xs : AppSpacing.sm;
    final chipVerticalPadding = isCompact ? 3.0 : AppSpacing.xxs;

    // Keep marker/label positions tied to painter geometry:
    // start=(0, h-8), end=(w, 0).
    final pickupPoint = Offset(routeLeft, routeTop + routeHeight - 8);
    final dropPoint = Offset(routeLeft + routeWidth, routeTop);

    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.center,
      children: [
        Container(
          width: _heroOuterSize,
          height: _heroOuterSize,
          decoration: BoxDecoration(shape: BoxShape.circle, color: theme.colorScheme.primary.withValues(alpha: 0.08)),
        ),
        Positioned(
          top: routeTop,
          left: routeLeft,
          child: SizedBox(
            width: routeWidth,
            height: routeHeight,
            child: CustomPaint(painter: _SecureHandoffRoutePainter(color: theme.colorScheme.primary)),
          ),
        ),
        Positioned(
          top: pickupPoint.dy - 7,
          left: pickupPoint.dx - 7,
          child: Container(
            width: 14,
            height: 14,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary.withValues(alpha: 0.75),
              shape: BoxShape.circle,
              border: Border.all(color: theme.colorScheme.surfaceContainerLowest, width: 2),
            ),
          ),
        ),
        Positioned(
          top: dropPoint.dy - 10,
          left: dropPoint.dx - 10,
          child: Stack(
            alignment: Alignment.center,
            children: [
              _PulseRing(color: theme.colorScheme.primary, size: 20),
              Container(
                width: 18,
                height: 18,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: theme.colorScheme.surfaceContainerLowest, width: 2),
                ),
              ),
            ],
          ),
        ),
        Container(
          width: 164,
          height: 164,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: theme.colorScheme.surfaceContainerLowest,
            border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2), width: 3),
            boxShadow: AppDepth.ambientShadow(theme.brightness),
          ),
          child: Center(
            child: Container(
              width: 94,
              height: 94,
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: theme.colorScheme.primary.withValues(alpha: 0.28),
                    blurRadius: 18,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: const Icon(Icons.inventory_2_rounded, color: AppColors.onPrimaryCta, size: 44),
            ),
          ),
        ),
        Positioned(
          top: isCompact ? 112 : 106,
          right: isCompact ? 96 : 92,
          child: Container(
            width: 28,
            height: 28,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              shape: BoxShape.circle,
              border: Border.all(color: theme.colorScheme.primary, width: 1.8),
            ),
            child: Icon(Icons.shield_rounded, color: theme.colorScheme.primary, size: 16),
          ),
        ),
        Positioned(
          top: pickupPoint.dy + (isCompact ? 30 : 34),
          left: pickupPoint.dx - (isCompact ? 58 : 66),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: chipHorizontalPadding, vertical: chipVerticalPadding),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: theme.colorScheme.surfaceContainerLow),
              boxShadow: AppDepth.ambientShadow(theme.brightness),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified_user_rounded, size: 14, color: Colors.green.shade600),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'RIDER VERIFIED',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.7,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          top: dropPoint.dy - (isCompact ? 54 : 58),
          left: dropPoint.dx - (isCompact ? 84 : 90),
          child: Container(
            padding: EdgeInsets.symmetric(horizontal: chipHorizontalPadding, vertical: chipVerticalPadding),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLowest,
              borderRadius: BorderRadius.circular(99),
              border: Border.all(color: theme.colorScheme.surfaceContainerLow),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.check_circle_rounded, size: 14, color: Colors.green.shade600),
                const SizedBox(width: AppSpacing.xs),
                Text(
                  'HANDOFF CHECKED',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.7,
                  ),
                ),
              ],
            ),
          ),
        ),
        Positioned(
          top: pickupPoint.dy + 12,
          left: pickupPoint.dx - 20,
          child: Text(
            'PICKUP',
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.7,
            ),
          ),
        ),
        Positioned(
          top: dropPoint.dy - 24,
          left: dropPoint.dx - 14,
          child: Text(
            'DROP',
            style: theme.textTheme.labelSmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.7,
            ),
          ),
        ),
      ],
    );
  }
}

class _SecureHandoffRoutePainter extends CustomPainter {
  const _SecureHandoffRoutePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(0, size.height - 8)
      ..cubicTo(size.width * 0.2, size.height * 0.44, size.width * 0.58, size.height * 0.96, size.width, 0);

    final dashPaint = Paint()
      ..color = color.withValues(alpha: 0.28)
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.6;

    const dashWidth = 5.0;
    const dashSpace = 6.0;

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = (distance + dashWidth).clamp(0.0, metric.length);
        canvas.drawPath(metric.extractPath(distance, next), dashPaint);
        distance += dashWidth + dashSpace;
      }

      final endTangent = metric.getTangentForOffset(metric.length);
      if (endTangent != null) {
        canvas.drawCircle(endTangent.position, 3.8, Paint()..color = color);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _SecureHandoffRoutePainter oldDelegate) => oldDelegate.color != color;
}

class _RouteCurvePainter extends CustomPainter {
  const _RouteCurvePainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final activePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.4
      ..strokeCap = StrokeCap.round;

    final basePaint = Paint()
      ..color = color.withValues(alpha: 0.22)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.8
      ..strokeCap = StrokeCap.round;

    final path = Path()
      ..moveTo(0, size.height - 4)
      ..cubicTo(size.width * 0.2, size.height * 0.16, size.width * 0.66, size.height * 0.88, size.width, 0);

    const dashWidth = 5.0;
    const dashSpace = 6.0;

    for (final metric in path.computeMetrics()) {
      var distance = 0.0;
      while (distance < metric.length) {
        final next = (distance + dashWidth).clamp(0.0, metric.length);
        final segment = metric.extractPath(distance, next);
        canvas.drawPath(segment, basePaint);
        distance += dashWidth + dashSpace;
      }

      final activeStart = metric.length * 0.52;
      final activeEnd = metric.length;
      final activeSegment = metric.extractPath(activeStart, activeEnd);
      canvas.drawPath(activeSegment, activePaint);

      final startTangent = metric.getTangentForOffset(0);
      final endTangent = metric.getTangentForOffset(metric.length);
      if (startTangent != null) {
        canvas.drawCircle(startTangent.position, 3.2, Paint()..color = color.withValues(alpha: 0.28));
      }
      if (endTangent != null) {
        canvas.drawCircle(endTangent.position, 4.2, Paint()..color = color);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _RouteCurvePainter oldDelegate) => oldDelegate.color != color;
}

class _PulseRing extends StatefulWidget {
  const _PulseRing({required this.color, this.size = 18});

  final Color color;
  final double size;

  @override
  State<_PulseRing> createState() => _PulseRingState();
}

class _PulseRingState extends State<_PulseRing> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1600),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: _controller,
    builder: (context, child) {
      final t = Curves.easeOut.transform(_controller.value);
      final scale = 0.5 + (t * 1.2);
      final opacity = 1 - t;

      return Transform.scale(
        scale: scale,
        child: Container(
          width: widget.size,
          height: widget.size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: widget.color.withValues(alpha: opacity * 0.35),
          ),
        ),
      );
    },
  );
}
