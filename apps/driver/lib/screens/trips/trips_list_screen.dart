import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../models/daily_stats.dart';
import '../../models/earnings_summary.dart';
import '../../models/trip_history_item.dart';
import '../../providers/home_provider.dart';
import '../../providers/trips_provider.dart';
import '../../theme/app_palette.dart';
import '../../theme/app_theme_extension.dart';
import '../../utils/app_routes.dart';

// ── Colour helpers ────────────────────────────────────────────────────────────

const _kAmber = Color(0xFFA5651B);
const _kAmberBg = Color(0xFFFFEACC);
const _kAvgEarning = 174.0;
const _kDailyGoal = 500.0;

Color _statusBarColor(String status, ColorScheme cs) {
  switch (status) {
    case 'delivered':
      return cs.tertiary;
    case 'cancelled':
      return cs.error;
    case 'returned':
    case 'undeliverable':
      return _kAmber;
    default:
      return cs.onSurfaceVariant;
  }
}

Color _statusBgColor(String status, ColorScheme cs) {
  switch (status) {
    case 'delivered':
      return cs.tertiaryContainer.withValues(alpha: 0.5);
    case 'cancelled':
      return cs.errorContainer;
    case 'returned':
    case 'undeliverable':
      return _kAmberBg;
    default:
      return cs.surfaceContainerHighest;
  }
}

Color _statusFgColor(String status, ColorScheme cs) {
  switch (status) {
    case 'delivered':
      return cs.tertiary;
    case 'cancelled':
      return cs.error;
    case 'returned':
    case 'undeliverable':
      return _kAmber;
    default:
      return cs.onSurfaceVariant;
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'delivered':
      return 'Delivered';
    case 'cancelled':
      return 'Cancelled';
    case 'returned':
      return 'Returned';
    case 'undeliverable':
      return 'Undeliverable';
    default:
      return status;
  }
}

Color _earningColor(double earning, ColorScheme cs) {
  if (earning <= 0) {
    return cs.onSurfaceVariant;
  }
  if (earning >= _kAvgEarning * 1.15) {
    return cs.tertiary;
  }
  if (earning >= _kAvgEarning * 0.85) {
    return cs.primary;
  }
  return _kAmber;
}

// ── Progress ring ─────────────────────────────────────────────────────────────

class _RingPainter extends CustomPainter {
  const _RingPainter({required this.progress});

  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.shortestSide - 8) / 2;

    final trackPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final clamped = progress.clamp(0.0, 1.0);
    final progressColor = clamped >= 1.0
        ? const Color(0xFF89F8C3)
        : clamped >= 0.7
            ? const Color(0xFFFFD77A)
            : Colors.white.withValues(alpha: 0.9);

    final progressPaint = Paint()
      ..color = progressColor
      ..strokeWidth = 5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);
    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -math.pi / 2,
      2 * math.pi * clamped,
      false,
      progressPaint,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) => old.progress != progress;
}

// ── Main screen ───────────────────────────────────────────────────────────────

class TripsListScreen extends ConsumerStatefulWidget {
  const TripsListScreen({super.key});

  @override
  ConsumerState<TripsListScreen> createState() => _TripsListScreenState();
}

class _TripsListScreenState extends ConsumerState<TripsListScreen> {
  Future<void> _onRefresh() async {
    ref.invalidate(allTerminalTripsProvider);
    ref.invalidate(weeklyTripSummaryProvider);
    ref.invalidate(dailyStatsProvider);
    await ref.read(tripsListProvider.future).catchError((_) => <TripHistoryItem>[]);
  }

  void _navigateToDetail(TripHistoryItem trip) {
    ref.read(selectedTripProvider.notifier).state = trip;
    context.push(AppRoutes.tripDetailPath(trip.orderId));
  }

  void _showFilterSheet() {
    final currentFilter = ref.read(tripsFilterProvider);
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _FilterSheetContent(
        currentDateRange: currentFilter.dateRange,
        onApply: (dateRange) {
          ref.read(tripsFilterProvider.notifier).setDateRange(dateRange);
        },
        onClear: () {
          ref.read(tripsFilterProvider.notifier).clear();
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final filter = ref.watch(tripsFilterProvider);
    final tripsAsync = ref.watch(tripsListProvider);
    final allAsync = ref.watch(allTerminalTripsProvider);

    final allTrips = allAsync.valueOrNull ?? [];
    final counts = {
      'all': allTrips.length,
      'delivered': allTrips.where((t) => t.status == 'delivered').length,
      'cancelled': allTrips.where((t) => t.status == 'cancelled').length,
      'returned': allTrips
          .where((t) => t.status == 'returned' || t.status == 'undeliverable')
          .length,
    };

    return Scaffold(
      backgroundColor: cs.surface,
      body: SafeArea(
        child: Column(
          children: [
            _Header(
              hasFilters: filter.hasActiveFilter,
              onFilter: _showFilterSheet,
            ),
            Expanded(
              child: RefreshIndicator(
                color: cs.primary,
                onRefresh: _onRefresh,
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  children: [
                    _SummaryBanner(
                      trips: allAsync.valueOrNull ?? [],
                    ),
                    const SizedBox(height: 4),
                    _FilterChips(
                      activeStatus: filter.status,
                      counts: counts,
                      onChange: (s) =>
                          ref.read(tripsFilterProvider.notifier).setStatus(s),
                    ),
                    const SizedBox(height: 4),
                    ..._buildContent(tripsAsync, filter),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildContent(
    AsyncValue<List<TripHistoryItem>> tripsAsync,
    TripsFilter filter,
  ) =>
      tripsAsync.when(
        loading: () => List.generate(3, (_) => const _SkeletonCard()),
        error: (e, _) => [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
            child: Center(
              child: Text(
                'Could not load trips. Pull to refresh.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          ),
        ],
        data: (trips) {
          if (trips.isEmpty) {
            return [_EmptyState(status: filter.status)];
          }
          return _buildGrouped(trips);
        },
      );

  List<Widget> _buildGrouped(List<TripHistoryItem> trips) {
    final groups = <String, List<TripHistoryItem>>{};
    for (final t in trips) {
      groups.putIfAbsent(t.dateGroup, () => []).add(t);
    }

    const order = ['today', 'yesterday', 'week', 'earlier'];
    final widgets = <Widget>[];

    for (final key in order) {
      final items = groups[key];
      if (items == null || items.isEmpty) {
        continue;
      }
      widgets.add(
        _DateGroupHeader(
          label: items.first.dateGroupLabel,
          count: items.length,
        ),
      );
      for (final trip in items) {
        widgets.add(
          _TripCard(
            trip: trip,
            onTap: () => _navigateToDetail(trip),
          ),
        );
      }
    }
    return widgets;
  }
}

// ── Header ────────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({required this.hasFilters, required this.onFilter});

  final bool hasFilters;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
      child: Row(
        children: [
          Expanded(
            child: Text(
              'Trips',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
            ),
          ),
          GestureDetector(
            onTap: onFilter,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: hasFilters
                    ? cs.primary.withValues(alpha: 0.12)
                    : cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Icon(
                    Icons.tune_rounded,
                    size: 20,
                    color: hasFilters ? cs.primary : cs.onSurface,
                  ),
                  if (hasFilters)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        width: 7,
                        height: 7,
                        decoration: BoxDecoration(
                          color: cs.primary,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: cs.surfaceContainerLow,
                            width: 1.5,
                          ),
                        ),
                      ),
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

// ── Summary Banner ────────────────────────────────────────────────────────────

class _SummaryBanner extends ConsumerWidget {
  const _SummaryBanner({required this.trips});

  final List<TripHistoryItem> trips;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(weeklyTripSummaryProvider);
    final statsAsync = ref.watch(dailyStatsProvider);
    final ext = Theme.of(context).extension<AppThemeExtension>()!;

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Container(
        decoration: BoxDecoration(
          gradient: ext.primaryGradient,
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Color.fromRGBO(70, 72, 212, 0.25),
              blurRadius: 28,
              offset: Offset(0, 12),
            ),
          ],
        ),
        padding: const EdgeInsets.all(20),
        child: _BannerContent(
          summary: summaryAsync.valueOrNull,
          stats: statsAsync.valueOrNull,
          trips: trips,
        ),
      ),
    );
  }
}

class _BannerContent extends StatelessWidget {
  const _BannerContent({
    required this.summary,
    required this.stats,
    required this.trips,
  });

  final EarningsSummary? summary;
  final DailyStats? stats;
  final List<TripHistoryItem> trips;

  String _weekLabel() {
    final now = DateTime.now();
    final start = now.subtract(Duration(days: now.weekday - 1));
    final end = start.add(const Duration(days: 6));
    return 'This Week · ${DateFormat('MMM d').format(start)} – ${DateFormat('MMM d').format(end)}';
  }

  @override
  Widget build(BuildContext context) {
    final weekEarnings = summary?.earnings.thisWeek ?? stats?.weeklyEarnings ?? 0.0;
    final weekTrips = summary?.deliveries.thisWeek ?? trips.length;
    final weekDistance = trips.fold<double>(0, (s, t) => s + t.distanceKm);
    final avgPerTrip = summary?.earnings.averageOrderValue ??
        (weekTrips > 0 ? weekEarnings / weekTrips : 0.0);
    final todayEarnings = summary?.earnings.today ?? stats?.earnings ?? 0.0;
    final dailyProgress = (todayEarnings / _kDailyGoal).clamp(0.0, 1.0);

    final intFmt = NumberFormat('#,##0', 'en_IN');
    final decFmt = NumberFormat('#,##0.#', 'en_IN');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Period label
        Text(
          _weekLabel(),
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w700,
            color: Colors.white60,
            letterSpacing: 0.08,
          ),
        ),
        const SizedBox(height: 10),

        // Earnings row + daily ring
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Big earnings number
                  RichText(
                    text: TextSpan(
                      children: [
                        const TextSpan(
                          text: '₹',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        TextSpan(
                          text: intFmt.format(weekEarnings),
                          style: const TextStyle(
                            fontSize: 36,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -1,
                            height: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'week earnings',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Daily goal ring
            Column(
              children: [
                SizedBox(
                  width: 68,
                  height: 68,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CustomPaint(
                        size: const Size(68, 68),
                        painter: _RingPainter(progress: dailyProgress),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${(dailyProgress * 100).round()}%',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Colors.white,
                              height: 1,
                            ),
                          ),
                          const Text(
                            'GOAL',
                            style: TextStyle(
                              fontSize: 7,
                              fontWeight: FontWeight.w700,
                              color: Colors.white54,
                              letterSpacing: 0.06,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${intFmt.format(todayEarnings)} today',
                  style: const TextStyle(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: Colors.white54,
                  ),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Sub-stats row
        Container(
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.11),
            borderRadius: BorderRadius.circular(10),
          ),
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              _BannerStat(label: 'Trips', value: '$weekTrips'),
              _Divider(),
              _BannerStat(
                label: 'Distance',
                value: '${decFmt.format(weekDistance)} km',
              ),
              _Divider(),
              _BannerStat(
                label: 'Avg / Trip',
                value: '₹${intFmt.format(avgPerTrip)}',
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _BannerStat extends StatelessWidget {
  const _BannerStat({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Expanded(
        child: Column(
          children: [
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: Colors.white60,
                letterSpacing: 0.08,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                color: Colors.white,
              ),
            ),
          ],
        ),
      );
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        width: 1,
        height: 28,
        color: Colors.white.withValues(alpha: 0.15),
      );
}

// ── Filter chips ──────────────────────────────────────────────────────────────

class _FilterChips extends StatelessWidget {
  const _FilterChips({
    required this.activeStatus,
    required this.counts,
    required this.onChange,
  });

  final String activeStatus;
  final Map<String, int> counts;
  final ValueChanged<String> onChange;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    const chips = [
      ('all', 'All'),
      ('delivered', 'Delivered'),
      ('returned', 'Returned'),
      ('cancelled', 'Cancelled'),
    ];

    return SizedBox(
      height: 44,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemCount: chips.length,
        itemBuilder: (_, i) {
          final (id, label) = chips[i];
          final selected = activeStatus == id;
          final count = counts[id] ?? 0;
          return GestureDetector(
            onTap: () => onChange(id),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: selected ? cs.primary : cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(20),
                boxShadow: selected
                    ? [
                        BoxShadow(
                          color: cs.primary.withValues(alpha: 0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ]
                    : null,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: selected ? Colors.white : cs.onSurface,
                    ),
                  ),
                  const SizedBox(width: 5),
                  Text(
                    '$count',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: selected
                          ? Colors.white.withValues(alpha: 0.7)
                          : cs.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Date group header ─────────────────────────────────────────────────────────

class _DateGroupHeader extends StatelessWidget {
  const _DateGroupHeader({required this.label, required this.count});

  final String label;
  final int count;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 10),
      child: Row(
        children: [
          Text(
            label.toUpperCase(),
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              color: cs.onSurfaceVariant,
              letterSpacing: 0.06,
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Divider(
              thickness: 1,
              color: cs.outlineVariant.withValues(alpha: 0.12),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: cs.surfaceContainerLow,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$count',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: cs.onSurfaceVariant,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Trip card ─────────────────────────────────────────────────────────────────

class _TripCard extends StatefulWidget {
  const _TripCard({required this.trip, required this.onTap});

  final TripHistoryItem trip;
  final VoidCallback onTap;

  @override
  State<_TripCard> createState() => _TripCardState();
}

class _TripCardState extends State<_TripCard> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final t = widget.trip;
    final barColor = _statusBarColor(t.status, cs);
    final fgColor = _statusFgColor(t.status, cs);
    final bgColor = _statusBgColor(t.status, cs);
    final eColor = _earningColor(t.netEarning, cs);

    final earningText = t.netEarning <= 0
        ? '—'
        : t.netEarning < 10
            ? '₹${t.netEarning.toStringAsFixed(2)}'
            : '₹${t.netEarning.round()}';

    return GestureDetector(
      onTapDown: (_) => setState(() => _pressed = true),
      onTapUp: (_) {
        setState(() => _pressed = false);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.985 : 1.0,
        duration: const Duration(milliseconds: 120),
        child: Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
          decoration: BoxDecoration(
            color: cs.surface,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: cs.outlineVariant.withValues(alpha: 0.12),
                offset: const Offset(0, 1),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Left accent bar
              Positioned(
                left: 0,
                top: 12,
                bottom: 12,
                child: Container(
                  width: 3,
                  decoration: BoxDecoration(
                    color: barColor,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(18, 13, 14, 13),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Row 1: route + earning
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            '${t.displayPickup}  →  ${t.displayDrop}',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: cs.onSurface,
                              letterSpacing: -0.3,
                              height: 1.25,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Text(
                          earningText,
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: eColor,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 5),

                    // Row 2: order # + status pill + time
                    Row(
                      children: [
                        Text(
                          t.orderNumber,
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 7,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: bgColor,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _statusLabel(t.status).toUpperCase(),
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.w700,
                              color: fgColor,
                              letterSpacing: 0.06,
                            ),
                          ),
                        ),
                        const Spacer(),
                        if (t.formattedTime.isNotEmpty)
                          Text(
                            t.formattedTime,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: cs.onSurfaceVariant,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 9),

                    // Row 3: meta chips
                    Wrap(
                      spacing: 5,
                      runSpacing: 5,
                      children: [
                        if (t.distanceKm > 0)
                          _MetaChip(
                            icon: Icons.straighten_rounded,
                            label: '${t.distanceKm.toStringAsFixed(1)} km',
                          ),
                        if (t.packageType != null && t.packageType!.isNotEmpty)
                          _MetaChip(
                            icon: Icons.inventory_2_outlined,
                            label: t.packageType!,
                          ),
                        if (t.tip > 0)
                          _MetaChip(
                            icon: Icons.star_rounded,
                            label: '+₹${t.tip % 1 == 0 ? t.tip.toInt() : t.tip.toStringAsFixed(1)} tip',
                            color: _kAmber,
                            bgColor: _kAmberBg,
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Meta chip ─────────────────────────────────────────────────────────────────

class _MetaChip extends StatelessWidget {
  const _MetaChip({
    required this.icon,
    required this.label,
    this.color,
    this.bgColor,
  });

  final IconData icon;
  final String label;
  final Color? color;
  final Color? bgColor;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fg = color ?? cs.onSurface;
    final bg = bgColor ?? cs.surfaceContainerLow;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: fg),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: fg,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Skeleton card ─────────────────────────────────────────────────────────────

class _SkeletonCard extends StatelessWidget {
  const _SkeletonCard();

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final shimmer = cs.surfaceContainerLow;

    Widget box(double w, double h) => Container(
          width: w,
          height: h,
          decoration: BoxDecoration(
            color: shimmer,
            borderRadius: BorderRadius.circular(6),
          ),
        );

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      padding: const EdgeInsets.fromLTRB(18, 14, 14, 14),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: cs.outlineVariant.withValues(alpha: 0.12),
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              box(140, 14),
              const Spacer(),
              box(50, 16),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              box(70, 10),
              const SizedBox(width: 6),
              box(60, 10),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              box(60, 10),
              const SizedBox(width: 5),
              box(80, 10),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Empty state ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.status});

  final String status;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final messages = {
      'all': ('No trips yet', 'Completed deliveries will appear here.'),
      'delivered': ('No delivered trips', 'Delivered orders will show up here.'),
      'cancelled': ('No cancelled trips', 'Cancelled orders will appear here.'),
      'returned': ('No returned trips', 'Returned deliveries will appear here.'),
    };
    final (title, subtitle) = messages[status] ?? messages['all']!;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 48, horizontal: 24),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: cs.surfaceContainerLow,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.route_outlined,
              size: 36,
              color: cs.primary.withValues(alpha: 0.5),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: cs.onSurfaceVariant,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }
}

// ── Filter bottom sheet ───────────────────────────────────────────────────────

class _FilterSheetContent extends StatefulWidget {
  const _FilterSheetContent({
    required this.currentDateRange,
    required this.onApply,
    required this.onClear,
  });

  final String currentDateRange;
  final ValueChanged<String> onApply;
  final VoidCallback onClear;

  @override
  State<_FilterSheetContent> createState() => _FilterSheetContentState();
}

class _FilterSheetContentState extends State<_FilterSheetContent> {
  late String _localRange;

  @override
  void initState() {
    super.initState();
    _localRange = widget.currentDateRange;
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final ext = Theme.of(context).extension<AppThemeExtension>()!;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primary = isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary;

    const ranges = [
      ('today', 'Today'),
      ('7days', 'Last 7 days'),
      ('week', 'This week'),
      ('30days', 'Last 30 days'),
      ('month', 'This month'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Padding(
              padding: const EdgeInsets.only(top: 10, bottom: 4),
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
          ),

          // Title row
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 16, 0),
            child: Row(
              children: [
                Text(
                  'Filters',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(Icons.close_rounded, color: cs.onSurface, size: 20),
                  style: IconButton.styleFrom(
                    backgroundColor: cs.surfaceContainerLow,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Date range label
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 10),
            child: Text(
              'DATE RANGE',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w800,
                color: cs.onSurfaceVariant,
                letterSpacing: 0.08,
              ),
            ),
          ),

          // Range chips
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ranges.map(((String, String) r) {
                final (id, label) = r;
                final sel = _localRange == id;
                return GestureDetector(
                  onTap: () => setState(() => _localRange = id),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9,
                    ),
                    decoration: BoxDecoration(
                      color: sel ? primary : cs.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (sel)
                          const Padding(
                            padding: EdgeInsets.only(right: 6),
                            child: Icon(
                              Icons.check_rounded,
                              size: 12,
                              color: Colors.white,
                            ),
                          ),
                        Text(
                          label,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: sel ? Colors.white : cs.onSurface,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          // Note
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: cs.surfaceContainerLow,
                borderRadius: BorderRadius.circular(10),
              ),
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                    fontSize: 11,
                    color: cs.onSurfaceVariant,
                    height: 1.5,
                  ),
                  children: [
                    TextSpan(
                      text: 'Status filters ',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: cs.onSurface,
                      ),
                    ),
                    const TextSpan(
                      text: 'are available as chips above the trip list.',
                    ),
                  ],
                ),
              ),
            ),
          ),

          // CTA buttons
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
            child: Row(
              children: [
                Expanded(
                  child: FilledButton.tonal(
                    onPressed: () {
                      widget.onClear();
                      Navigator.pop(context);
                    },
                    style: FilledButton.styleFrom(
                      minimumSize: const Size.fromHeight(52),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Clear all',
                      style: TextStyle(fontWeight: FontWeight.w700),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  flex: 2,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: ext.primaryGradient,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: primary.withValues(alpha: 0.35),
                          blurRadius: 18,
                          offset: const Offset(0, 6),
                        ),
                      ],
                    ),
                    child: FilledButton(
                      onPressed: () {
                        widget.onApply(_localRange);
                        Navigator.pop(context);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        minimumSize: const Size.fromHeight(52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Apply',
                        style: TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 14,
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
    );
  }
}
