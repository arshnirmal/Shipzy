import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/trip_history_item.dart';
import '../../providers/earnings_provider.dart';
import '../../providers/home_provider.dart';
import '../../theme/app_palette.dart';
import '../../theme/app_theme_extension.dart';
import '../../theme/design_tokens.dart';
import '../../utils/app_routes.dart';
import '../../providers/payment_provider.dart';

// ─── Bar entry ─────────────────────────────────────────────────────────────────

class _BarEntry {
  const _BarEntry({
    required this.label,
    required this.value,
    this.isFuture = false,
  });

  final String label;
  final double value;
  final bool isFuture;
}

// ─── Main screen ───────────────────────────────────────────────────────────────

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(earningsPeriodProvider);
    final profileAsync = ref.watch(driverProfileProvider);
    final driverFirstName =
        profileAsync.valueOrNull?.fullName.split(' ').first ?? '';

    return Scaffold(
      backgroundColor: Theme.of(context).colorScheme.surface,
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.surface,
        surfaceTintColor: Colors.transparent,
        scrolledUnderElevation: 0,
        elevation: 0,
        automaticallyImplyLeading: false,
        titleSpacing: AppSpacing.md,
        title: Text(
          'Earnings',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        actions: [
          if (driverFirstName.isNotEmpty)
            Container(
              margin: const EdgeInsets.only(right: AppSpacing.md),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.xxs,
              ),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerLow,
                borderRadius: BorderRadius.circular(AppRadius.lg),
              ),
              child: Text(
                driverFirstName,
                style: Theme.of(context).textTheme.labelMedium,
              ),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(earningsTripsProvider);
          ref.invalidate(earningsPrevAmountProvider);
          ref.invalidate(driverProfileProvider);
        },
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const SizedBox(height: AppSpacing.xs),
            _PeriodTabs(period: period),
            const SizedBox(height: AppSpacing.sm),
            const _HeroCard(),
            const SizedBox(height: AppSpacing.sm),
            const _BarChartSection(),
            const SizedBox(height: AppSpacing.sm),
            const _StatGridSection(),
            const SizedBox(height: AppSpacing.sm),
            const _GoalCardSection(),
            const SizedBox(height: AppSpacing.sm),
            const _RecentTripsSection(),
            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}

// ─── Period tabs ───────────────────────────────────────────────────────────────

class _PeriodTabs extends ConsumerWidget {
  const _PeriodTabs({required this.period});

  final String period;

  static const _periods = ['today', 'week', 'month', 'year'];
  static const _labels = ['Today', 'Week', 'Month', 'Year'];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(4),
        child: Row(
          children: List.generate(_periods.length, (i) {
            final isSelected = _periods[i] == period;
            return Expanded(
              child: GestureDetector(
                onTap: () => ref
                    .read(earningsPeriodProvider.notifier)
                    .setPeriod(_periods[i]),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  height: 34,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? theme.colorScheme.surface
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(9),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: theme.colorScheme.shadow
                                  .withValues(alpha: 0.08),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    _labels[i],
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: isSelected
                          ? theme.colorScheme.primary
                          : theme.colorScheme.onSurfaceVariant,
                      fontWeight:
                          isSelected ? FontWeight.w800 : FontWeight.w600,
                    ),
                  ),
                ),
              ),
            );
          }),
        ),
      ),
    );
  }
}

// ─── Hero card ─────────────────────────────────────────────────────────────────

class _HeroCard extends ConsumerWidget {
  const _HeroCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(earningsPeriodProvider);
    final tripsAsync = ref.watch(earningsTripsProvider);
    final prevAsync = ref.watch(earningsPrevAmountProvider);
    final themeExt = Theme.of(context).extension<AppThemeExtension>();
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final paymentAsync = ref.watch(paymentEarningsProvider(period));
    final prevPaymentAsync = ref.watch(paymentEarningsProvider(_previousPeriod(period)));

    final currentEarnings = paymentAsync.valueOrNull?.netEarnings ?? 
        tripsAsync.valueOrNull?.fold<double>(0, (s, t) => s + t.netEarning) ?? 0.0;
        
    final prevEarnings = prevPaymentAsync.valueOrNull?.netEarnings ?? prevAsync.valueOrNull ?? 0.0;
    
    final deltaPercent = prevEarnings > 0
        ? (currentEarnings - prevEarnings) / prevEarnings * 100
        : 0.0;

    final fmt = NumberFormat('#,##,##0', 'en_IN');

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: themeExt?.primaryGradient ??
              (isDark
                  ? AppPalette.primaryGradientDark
                  : AppPalette.primaryGradientLight),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color:
                  (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
                      .withValues(alpha: 0.28),
              blurRadius: 32,
              offset: const Offset(0, 12),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              top: -50,
              right: -30,
              child: Container(
                width: 150,
                height: 150,
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Color.fromRGBO(255, 255, 255, 0.06),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _scopeLabel(period).toUpperCase(),
                  style: const TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                    color: Color.fromRGBO(255, 255, 255, 0.65),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 7),
                      child: Text(
                        '₹',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                          height: 1,
                        ),
                      ),
                    ),
                    const SizedBox(width: 3),
                    tripsAsync.when(
                      data: (_) => Text(
                        fmt.format(currentEarnings.round()),
                        style: const TextStyle(
                          fontSize: 40,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          height: 1,
                          letterSpacing: -1.2,
                        ),
                      ),
                      loading: () => const _SkeletonBox(
                        width: 140,
                        height: 40,
                        light: true,
                      ),
                      error: (_, __) => const Text(
                        '--',
                        style: TextStyle(
                          fontSize: 40,
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (!tripsAsync.isLoading)
                  _DeltaBadge(
                    percent: deltaPercent,
                    up: deltaPercent >= 0,
                    prevLoading: prevAsync.isLoading,
                    periodLabel: _deltaLabel(period),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _DeltaBadge extends StatelessWidget {
  const _DeltaBadge({
    required this.percent,
    required this.up,
    required this.prevLoading,
    required this.periodLabel,
  });

  final double percent;
  final bool up;
  final bool prevLoading;
  final String periodLabel;

  @override
  Widget build(BuildContext context) {
    if (prevLoading) {
      return const _SkeletonBox(
        width: 110,
        height: 26,
        light: true,
        radius: 20,
      );
    }
    final textColor = up ? const Color(0xFF89F8C3) : const Color(0xFFFFB4AB);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
      decoration: BoxDecoration(
        color: const Color.fromRGBO(255, 255, 255, 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            up ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
            color: textColor,
            size: 12,
          ),
          const SizedBox(width: 4),
          Text(
            '${percent.abs().toStringAsFixed(1)}% $periodLabel',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w800,
              color: textColor,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Bar chart section ─────────────────────────────────────────────────────────

class _BarChartSection extends ConsumerWidget {
  const _BarChartSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(earningsPeriodProvider);
    final tripsAsync = ref.watch(earningsTripsProvider);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        padding: const EdgeInsets.all(AppSpacing.md),
        child: tripsAsync.when(
          data: (trips) => _BarChart(
            key: ValueKey(period),
            entries: _computeBarEntries(trips, period),
            barLabel: _barChartLabel(period),
          ),
          loading: () => const SizedBox(
            height: 160,
            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
          ),
          error: (_, __) => SizedBox(
            height: 100,
            child: Center(
              child: Text(
                'Could not load chart',
                style: theme.textTheme.bodySmall,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── Bar chart widget ──────────────────────────────────────────────────────────

class _BarChart extends StatefulWidget {
  const _BarChart({
    required this.entries,
    required this.barLabel,
    super.key,
  });

  final List<_BarEntry> entries;
  final String barLabel;

  @override
  State<_BarChart> createState() => _BarChartState();
}

class _BarChartState extends State<_BarChart>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  int? _selectedIndex;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    )..forward();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  double get _maxValue {
    if (widget.entries.isEmpty) {
      return 1;
    }
    final m = widget.entries.map((e) => e.value).reduce(math.max);
    return m > 0 ? m : 1;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primary = isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary;
    final n = widget.entries.length;
    const double chartH = 120;
    final selected = _selectedIndex;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '${widget.barLabel} breakdown',
              style: theme.textTheme.labelMedium,
            ),
            if (selected != null &&
                selected < widget.entries.length &&
                widget.entries[selected].value > 0)
              Text(
                '${_fmtCompact(widget.entries[selected].value)} · '
                '${widget.entries[selected].label}',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                  color: primary,
                ),
              ),
          ],
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: chartH,
          child: AnimatedBuilder(
            animation: _ctrl,
            builder: (ctx, _) => Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: widget.entries.asMap().entries.map((entry) {
                final i = entry.key;
                final bar = entry.value;
                final isEmpty = bar.value <= 0;
                final isSelected = selected == i;

                final staggerStart = (i / n) * 0.5;
                final staggerEnd = (staggerStart + 0.5).clamp(0.0, 1.0);
                final rawProgress = staggerEnd > staggerStart
                    ? ((_ctrl.value - staggerStart) /
                            (staggerEnd - staggerStart))
                        .clamp(0.0, 1.0)
                    : 1.0;
                final easedProgress =
                    Curves.elasticOut.transform(rawProgress);

                final heightPct = isEmpty
                    ? 0.0
                    : math.max(
                          (bar.value / _maxValue) * 0.92 + 0.08,
                          0.08,
                        ) *
                        easedProgress;

                final barColor = bar.isFuture || isEmpty
                    ? theme.colorScheme.surfaceContainerHigh
                    : isSelected
                        ? primary
                        : primary.withValues(alpha: 0.5);

                final hGap = n > 10 ? 1.5 : n > 6 ? 2.5 : 4.0;

                return Expanded(
                  child: GestureDetector(
                    onTap: isEmpty || bar.isFuture
                        ? null
                        : () => setState(() {
                              _selectedIndex = isSelected ? null : i;
                            }),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Stack(
                          alignment: Alignment.topCenter,
                          children: [
                            Container(
                              height: chartH * heightPct,
                              margin: EdgeInsets.symmetric(horizontal: hGap),
                              decoration: BoxDecoration(
                                color: barColor,
                                borderRadius:
                                    BorderRadius.circular(isEmpty ? 2 : 4),
                              ),
                            ),
                            if (isSelected && !isEmpty)
                              Container(
                                width: 6,
                                height: 6,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: primary,
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          bar.label,
                          style: TextStyle(
                            fontSize: n > 10 ? 9 : 10,
                            fontWeight: FontWeight.w700,
                            color: isSelected
                                ? theme.colorScheme.onSurface
                                : theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }
}

// ─── Stat grid section ─────────────────────────────────────────────────────────

class _StatGridSection extends ConsumerWidget {
  const _StatGridSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(earningsPeriodProvider);
    final tripsAsync = ref.watch(earningsTripsProvider);
    final trips = tripsAsync.valueOrNull ?? [];
    final isLoading = tripsAsync.isLoading;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final paymentAsync = ref.watch(paymentEarningsProvider(period));
    final paymentData = paymentAsync.valueOrNull;

    final delivered = trips.where((t) => t.status == 'delivered').toList();
    final totalEarnings = paymentData?.netEarnings ?? trips.fold<double>(0, (s, t) => s + t.netEarning);
    final avgPerTrip =
        delivered.isEmpty ? 0.0 : totalEarnings / delivered.length;
    final totalDistance = trips.fold<double>(0, (s, t) => s + t.distanceKm);

    final entries = _computeBarEntries(trips, period);
    _BarEntry? bestEntry;
    if (entries.isNotEmpty) {
      bestEntry = entries.reduce((a, b) => a.value >= b.value ? a : b);
      if (bestEntry.value <= 0) {
        bestEntry = null;
      }
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisSpacing: AppSpacing.sm,
        mainAxisSpacing: AppSpacing.sm,
        childAspectRatio: 1.45,
        children: [
          _StatCard(
            icon: Icons.local_shipping_outlined,
            iconColor:
                isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary,
            iconBg: (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
                .withValues(alpha: 0.12),
            label: 'Total Trips',
            value: isLoading ? '--' : '${trips.length}',
            sub: bestEntry != null
                ? '${bestEntry.label} was your best'
                : 'this $period',
          ),
          _StatCard(
            icon: Icons.show_chart_rounded,
            iconColor:
                isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary,
            iconBg: (isDark
                    ? AppPalette.darkTertiaryContainer
                    : AppPalette.lightTertiaryContainer)
                .withValues(alpha: 0.5),
            label: 'Avg Per Trip',
            value: isLoading ? '--' : _fmtAmount(avgPerTrip),
            sub: 'average order value',
          ),
          _StatCard(
            icon: Icons.route_outlined,
            iconColor: isDark ? AppPalette.busyDark : AppPalette.busyLight,
            iconBg: (isDark ? AppPalette.busyDark : AppPalette.busyLight)
                .withValues(alpha: 0.12),
            label: 'Distance',
            value: isLoading ? '--' : '${totalDistance.toStringAsFixed(1)} km',
            sub: 'total distance covered',
          ),
          _StatCard(
            icon: Icons.emoji_events_outlined,
            iconColor: isDark ? AppPalette.darkError : AppPalette.lightError,
            iconBg: (isDark
                    ? AppPalette.darkErrorContainer
                    : AppPalette.lightErrorContainer)
                .withValues(alpha: 0.4),
            label: bestEntry != null ? 'Best Period' : 'Online Hours',
            value: isLoading ? '--' : (bestEntry?.label ?? '--'),
            sub: bestEntry != null ? _fmtAmount(bestEntry.value) : 'no data yet',
          ),
        ],
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.label,
    required this.value,
    required this.sub,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBg;
  final String label;
  final String value;
  final String sub;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(AppRadius.xl),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(9),
            ),
            alignment: Alignment.center,
            child: Icon(icon, color: iconColor, size: 17),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: theme.textTheme.titleMedium?.copyWith(
                  letterSpacing: -0.32,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 1),
              Text(label, style: theme.textTheme.labelSmall),
              Text(
                sub,
                style: theme.textTheme.bodySmall?.copyWith(fontSize: 10),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Goal card section ─────────────────────────────────────────────────────────

class _GoalCardSection extends ConsumerWidget {
  const _GoalCardSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final period = ref.watch(earningsPeriodProvider);
    final tripsAsync = ref.watch(earningsTripsProvider);
    final goals = ref.watch(earningsGoalProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final paymentAsync = ref.watch(paymentEarningsProvider(period));
    final paymentData = paymentAsync.valueOrNull;

    final currentEarnings = paymentData?.netEarnings ?? 
        tripsAsync.valueOrNull?.fold<double>(0, (s, t) => s + t.netEarning) ??
            0.0;
    final goalAmount = goals[period] ?? 500.0;
    final progress =
        goalAmount > 0 ? (currentEarnings / goalAmount).clamp(0.0, 1.0) : 0.0;
    final reached = currentEarnings >= goalAmount;
    final remaining = (goalAmount - currentEarnings).clamp(0.0, goalAmount);

    final ringColor = progress >= 1.0
        ? (isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary)
        : progress >= 0.7
            ? (isDark ? AppPalette.busyDark : AppPalette.busyLight)
            : (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 68,
              height: 68,
              child: CustomPaint(
                painter: _GoalRingPainter(
                  progress: progress,
                  trackColor: theme.colorScheme.surfaceContainerHigh,
                  fillColor: ringColor,
                  strokeWidth: 5,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _periodGoalLabel(period),
                    style: theme.textTheme.labelSmall?.copyWith(
                      letterSpacing: 0.7,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 3),
                  RichText(
                    text: TextSpan(
                      text: _fmtAmount(currentEarnings),
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.32,
                      ),
                      children: [
                        TextSpan(
                          text: ' / ${_fmtAmount(goalAmount)}',
                          style: theme.textTheme.bodySmall
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    reached
                        ? '🎉 Goal reached! Great work.'
                        : '${_fmtAmount(remaining)} more to go',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: reached ? ringColor : null,
                      fontWeight: reached ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => showModalBottomSheet<void>(
                context: context,
                isScrollControlled: true,
                backgroundColor: Colors.transparent,
                builder: (_) => _GoalBottomSheet(
                  period: period,
                  currentGoal: goalAmount,
                  onSave: (v) =>
                      ref.read(earningsGoalProvider.notifier).setGoal(period, v),
                ),
              ),
              child: Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerLow,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  border: Border.all(color: theme.colorScheme.outlineVariant),
                ),
                alignment: Alignment.center,
                child: Icon(
                  Icons.edit_outlined,
                  size: 14,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Goal ring painter ─────────────────────────────────────────────────────────

class _GoalRingPainter extends CustomPainter {
  const _GoalRingPainter({
    required this.progress,
    required this.trackColor,
    required this.fillColor,
    required this.strokeWidth,
  });

  final double progress;
  final Color trackColor;
  final Color fillColor;
  final double strokeWidth;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    canvas.drawArc(
      rect,
      -math.pi / 2,
      2 * math.pi,
      false,
      Paint()
        ..color = trackColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round,
    );

    if (progress > 0) {
      canvas.drawArc(
        rect,
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        Paint()
          ..color = fillColor
          ..style = PaintingStyle.stroke
          ..strokeWidth = strokeWidth
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  @override
  bool shouldRepaint(_GoalRingPainter old) =>
      progress != old.progress ||
      fillColor != old.fillColor ||
      trackColor != old.trackColor;
}

// ─── Goal bottom sheet ─────────────────────────────────────────────────────────

class _GoalBottomSheet extends StatefulWidget {
  const _GoalBottomSheet({
    required this.period,
    required this.currentGoal,
    required this.onSave,
  });

  final String period;
  final double currentGoal;
  final ValueChanged<double> onSave;

  @override
  State<_GoalBottomSheet> createState() => _GoalBottomSheetState();
}

class _GoalBottomSheetState extends State<_GoalBottomSheet> {
  late final TextEditingController _ctrl;

  static const _presets = <String, List<int>>{
    'today': [300, 500, 750, 1000, 1500],
    'week': [2000, 3000, 4000, 5000, 7500],
    'month': [8000, 12000, 15000, 20000, 30000],
    'year': [50000, 100000, 150000, 200000, 300000],
  };

  @override
  void initState() {
    super.initState();
    _ctrl = TextEditingController(
      text: widget.currentGoal.round().toString(),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primary = isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary;
    final presets = _presets[widget.period] ?? _presets['today']!;
    final fmt = NumberFormat('#,##,##0', 'en_IN');

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.fromLTRB(
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md,
        AppSpacing.md + MediaQuery.viewInsetsOf(context).bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 36,
              height: 4,
              margin: const EdgeInsets.only(bottom: AppSpacing.md),
              decoration: BoxDecoration(
                color: theme.colorScheme.outlineVariant,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Text(
            'Edit ${_periodLabel(widget.period)} Goal',
            style:
                theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            "Choose how much you'd like to earn",
            style: theme.textTheme.bodySmall,
          ),
          const SizedBox(height: AppSpacing.md),
          ListenableBuilder(
            listenable: _ctrl,
            builder: (_, __) => Wrap(
              spacing: AppSpacing.xs,
              runSpacing: AppSpacing.xs,
              children: presets.map((p) {
                final isSelected = _ctrl.text == p.toString();
                return GestureDetector(
                  onTap: () => setState(() => _ctrl.text = p.toString()),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.md,
                      vertical: AppSpacing.xs,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? primary.withValues(alpha: 0.12)
                          : theme.colorScheme.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isSelected ? primary : Colors.transparent,
                      ),
                    ),
                    child: Text(
                      '₹${fmt.format(p)}',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        color:
                            isSelected ? primary : theme.colorScheme.onSurface,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md,
              vertical: AppSpacing.sm,
            ),
            child: Row(
              children: [
                Text(
                  '₹',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: TextField(
                    controller: _ctrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration.collapsed(
                      hintText: 'Custom amount',
                    ),
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: isDark
                    ? AppPalette.primaryGradientDark
                    : AppPalette.primaryGradientLight,
                borderRadius: BorderRadius.circular(AppRadius.lg),
                boxShadow: [
                  BoxShadow(
                    color: primary.withValues(alpha: 0.35),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: TextButton(
                onPressed: () {
                  final v = double.tryParse(_ctrl.text);
                  if (v != null && v > 0) {
                    widget.onSave(v);
                    Navigator.of(context).pop();
                  }
                },
                style: TextButton.styleFrom(
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppRadius.lg),
                  ),
                ),
                child: const Text(
                  'Save Goal',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Recent trips section ──────────────────────────────────────────────────────

class _RecentTripsSection extends ConsumerWidget {
  const _RecentTripsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(earningsTripsProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final primary = isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary;

    final sorted = List<TripHistoryItem>.of(tripsAsync.valueOrNull ?? [])
      ..sort((a, b) {
        final aTs = a.effectiveTimestamp;
        final bTs = b.effectiveTimestamp;
        if (aTs == null && bTs == null) {
          return 0;
        }
        if (aTs == null) {
          return 1;
        }
        if (bTs == null) {
          return -1;
        }
        return bTs.compareTo(aTs);
      });
    final recent = sorted.take(5).toList();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      child: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(AppRadius.xl),
        ),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.md,
          AppSpacing.xs,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Trips',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                TextButton(
                  onPressed: () => context.go(AppRoutes.orders),
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                    foregroundColor: primary,
                  ),
                  child: Text(
                    'View All →',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            if (tripsAsync.isLoading)
              ...List.generate(
                3,
                (_) => const Padding(
                  padding: EdgeInsets.symmetric(vertical: AppSpacing.xs),
                  child: _SkeletonBox(width: double.infinity, height: 40),
                ),
              )
            else if (recent.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.xl),
                child: Center(
                  child: Text(
                    'No trips this period',
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              )
            else
              ...recent.asMap().entries.map(
                    (e) => _TripRow(
                      trip: e.value,
                      isLast: e.key == recent.length - 1,
                    ),
                  ),
          ],
        ),
      ),
    );
  }
}

class _TripRow extends StatelessWidget {
  const _TripRow({required this.trip, required this.isLast});

  final TripHistoryItem trip;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final isCancelled = trip.status == 'cancelled';
    final isDelivered = trip.status == 'delivered';

    final dotColor = isDelivered
        ? (isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary)
        : isCancelled
            ? (isDark ? AppPalette.darkError : AppPalette.lightError)
            : (isDark ? AppPalette.busyDark : AppPalette.busyLight);

    final earningColor = isDelivered
        ? (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
        : theme.colorScheme.onSurfaceVariant;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : Border(
                bottom: BorderSide(
                  color:
                      theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
                ),
              ),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: dotColor,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${trip.displayPickup} → ${trip.displayDrop}',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: isCancelled
                        ? theme.colorScheme.onSurfaceVariant
                        : theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                    decoration:
                        isCancelled ? TextDecoration.lineThrough : null,
                    fontSize: 13,
                    letterSpacing: -0.13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 1),
                Text(
                  '${trip.orderNumber} · ${trip.formattedTime}',
                  style: theme.textTheme.labelSmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                isCancelled ? '₹0' : _fmtAmount(trip.netEarning),
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w800,
                  color: earningColor,
                  letterSpacing: -0.28,
                ),
              ),
              if (trip.tip > 0 && !isCancelled)
                Text(
                  '+₹${trip.tip.toStringAsFixed(0)} tip',
                  style: TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    color: isDark ? AppPalette.busyDark : AppPalette.busyLight,
                    letterSpacing: 0.27,
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Skeleton box ──────────────────────────────────────────────────────────────

class _SkeletonBox extends StatelessWidget {
  const _SkeletonBox({
    required this.width,
    required this.height,
    this.radius = 8,
    this.light = false,
  });

  final double width;
  final double height;
  final double radius;
  final bool light;

  @override
  Widget build(BuildContext context) {
    final color = light
        ? Colors.white.withValues(alpha: 0.2)
        : Theme.of(context).colorScheme.surfaceContainerHigh;
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

String _fmtAmount(double v) {
  if (v == 0) {
    return '₹0';
  }
  return '₹${NumberFormat('#,##,##0', 'en_IN').format(v.round())}';
}

String _fmtCompact(double v) {
  if (v >= 1000) {
    return '₹${(v / 1000).toStringAsFixed(1)}K';
  }
  return '₹${v.round()}';
}

String _scopeLabel(String period) {
  final now = DateTime.now();
  switch (period) {
    case 'today':
      return DateFormat('MMM d').format(now);
    case 'week':
      final start = now.subtract(Duration(days: now.weekday - 1));
      final end = start.add(const Duration(days: 6));
      if (start.month == end.month) {
        return '${DateFormat('MMM d').format(start)} – ${DateFormat('d').format(end)}';
      }
      return '${DateFormat('MMM d').format(start)} – ${DateFormat('MMM d').format(end)}';
    case 'month':
      return DateFormat('MMMM yyyy').format(now);
    case 'year':
      return DateFormat('yyyy').format(now);
    default:
      return '';
  }
}

String _deltaLabel(String period) {
  switch (period) {
    case 'today':
      return 'vs yesterday';
    case 'week':
      return 'vs last week';
    case 'month':
      return 'vs last month';
    case 'year':
      return 'vs last year';
    default:
      return '';
  }
}

String _periodGoalLabel(String period) {
  switch (period) {
    case 'today':
      return 'DAILY GOAL';
    case 'week':
      return 'WEEKLY GOAL';
    case 'month':
      return 'MONTHLY GOAL';
    case 'year':
      return 'YEARLY GOAL';
    default:
      return 'GOAL';
  }
}

String _barChartLabel(String period) {
  switch (period) {
    case 'today':
      return 'Hourly';
    case 'week':
      return 'Daily';
    case 'month':
      return 'Weekly';
    case 'year':
      return 'Monthly';
    default:
      return '';
  }
}

String _periodLabel(String period) {
  switch (period) {
    case 'today':
      return 'Daily';
    case 'week':
      return 'Weekly';
    case 'month':
      return 'Monthly';
    case 'year':
      return 'Yearly';
    default:
      return '';
  }
}

String _previousPeriod(String period) {
  switch (period) {
    case 'today': return 'yesterday';
    case 'week': return 'last_week';
    case 'month': return 'last_month';
    case 'year': return 'last_year';
    default: return period;
  }
}

// ─── Bar data computation ──────────────────────────────────────────────────────

List<_BarEntry> _computeBarEntries(
  List<TripHistoryItem> trips,
  String period,
) {
  DateTime? parseTs(String? ts) =>
      ts != null ? DateTime.tryParse(ts)?.toLocal() : null;

  switch (period) {
    case 'today':
      // 15 hourly bars: 7 AM – 9 PM
      return List.generate(15, (i) {
        final hour = i + 7;
        final label =
            hour == 12 ? '12P' : hour < 12 ? '${hour}A' : '${hour - 12}P';
        final value = trips
            .where((t) => parseTs(t.effectiveTimestamp)?.hour == hour)
            .fold<double>(0, (s, t) => s + t.netEarning);
        return _BarEntry(label: label, value: value);
      });

    case 'week':
      const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return List.generate(7, (i) {
        final value = trips
            .where((t) => parseTs(t.effectiveTimestamp)?.weekday == i + 1)
            .fold<double>(0, (s, t) => s + t.netEarning);
        return _BarEntry(label: labels[i], value: value);
      });

    case 'month':
      final now = DateTime.now();
      final monthStart = DateTime(now.year, now.month);
      return List.generate(4, (i) {
        final wkStart = monthStart.add(Duration(days: i * 7));
        final wkEnd = monthStart.add(Duration(days: (i + 1) * 7));
        final value = trips.where((t) {
          final dt = parseTs(t.effectiveTimestamp);
          return dt != null && !dt.isBefore(wkStart) && dt.isBefore(wkEnd);
        }).fold<double>(0, (s, t) => s + t.netEarning);
        return _BarEntry(label: 'W${i + 1}', value: value);
      });

    case 'year':
      const monthLabels = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
      ];
      final currentMonth = DateTime.now().month;
      return List.generate(12, (i) {
        final month = i + 1;
        final isFuture = month > currentMonth;
        final value = isFuture
            ? 0.0
            : trips
                .where((t) => parseTs(t.effectiveTimestamp)?.month == month)
                .fold<double>(0, (s, t) => s + t.netEarning);
        return _BarEntry(
          label: monthLabels[i],
          value: value,
          isFuture: isFuture,
        );
      });

    default:
      return [];
  }
}
