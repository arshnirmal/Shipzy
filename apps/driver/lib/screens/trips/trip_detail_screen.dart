import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/trip_history_item.dart';
import '../../providers/trips_provider.dart';
import '../../theme/app_theme_extension.dart';

// ── Status colour helpers ─────────────────────────────────────────────────────

const _kAmber = Color(0xFFA5651B);
const _kAmberBg = Color(0xFFFFEACC);

Color _statusAccent(String status, ColorScheme cs) {
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

Color _statusBg(String status, ColorScheme cs) {
  switch (status) {
    case 'delivered':
      return cs.tertiaryContainer.withValues(alpha: 0.4);
    case 'cancelled':
      return cs.errorContainer;
    case 'returned':
    case 'undeliverable':
      return _kAmberBg;
    default:
      return cs.surfaceContainerHighest;
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

String _fmt(String? raw) {
  if (raw == null) {
    return '';
  }
  final dt = DateTime.tryParse(raw)?.toLocal();
  return dt == null ? '' : DateFormat('MMM d, h:mm a').format(dt);
}

// ── Screen ────────────────────────────────────────────────────────────────────

class TripDetailScreen extends ConsumerWidget {
  const TripDetailScreen({required this.orderId, super.key});

  final int orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trip = ref.watch(selectedTripProvider);
    final orderAsync = ref.watch(tripDetailProvider(orderId));
    final cs = Theme.of(context).colorScheme;
    final status = trip?.status ?? 'delivered';
    final accentColor = _statusAccent(status, cs);

    return Scaffold(
      backgroundColor: cs.surfaceContainerLow,
      body: CustomScrollView(
        slivers: [
          _TripAppBar(
            trip: trip,
            orderId: orderId,
            accentColor: accentColor,
            cs: cs,
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate(
                _buildChildren(context, ref, trip, orderAsync, cs),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildChildren(
    BuildContext context,
    WidgetRef ref,
    TripHistoryItem? trip,
    AsyncValue<Map<String, dynamic>> orderAsync,
    ColorScheme cs,
  ) {
    final effectiveTrip = trip ?? _tripFromOrder(orderAsync.valueOrNull);

    return [
      if (effectiveTrip != null) ...[
        _HeroCard(trip: effectiveTrip, cs: cs),
        const SizedBox(height: 10),
        _RouteCard(trip: effectiveTrip, cs: cs),
        const SizedBox(height: 10),
      ],
      // Customer + Package — needs full order
      orderAsync.when(
        loading: () => _CustomerPackageSkeleton(cs: cs),
        error: (_, __) => _SmallError(
          onRetry: () => ref.invalidate(tripDetailProvider(orderId)),
          cs: cs,
        ),
        data: (order) {
          // If trip was null (deep link), build effectiveTrip from order
          final t = effectiveTrip ?? _tripFromOrder(order);
          return Column(
            children: [
              if (t != null && trip == null) ...[
                _HeroCard(trip: t, cs: cs),
                const SizedBox(height: 10),
                _RouteCard(trip: t, cs: cs),
                const SizedBox(height: 10),
              ],
              ..._orderDetailWidgets(order, cs),
            ],
          );
        },
      ),
      if (effectiveTrip != null) ...[
        const SizedBox(height: 10),
        _TimelineCard(trip: effectiveTrip, cs: cs),
        if (effectiveTrip.status == 'delivered') ...[
          const SizedBox(height: 10),
          _EarningsBreakdownCard(trip: effectiveTrip, cs: cs),
        ],
        const SizedBox(height: 10),
        _ReportButton(cs: cs),
      ],
    ];
  }

  List<Widget> _orderDetailWidgets(Map<String, dynamic> order, ColorScheme cs) {
    final client = order['client'] as Map<String, dynamic>?;
    final pkg = order['package'] as Map<String, dynamic>?;
    return [
      if (client != null) _CustomerCard(client: client, cs: cs),
      if (client != null) const SizedBox(height: 10),
      if (pkg != null) _PackageCard(pkg: pkg, cs: cs),
      if (pkg != null) const SizedBox(height: 10),
    ];
  }

  static TripHistoryItem? _tripFromOrder(Map<String, dynamic>? order) {
    if (order == null) {
      return null;
    }
    final pickup = order['pickup'] as Map<String, dynamic>?;
    final delivery = order['delivery'] as Map<String, dynamic>?;
    final pricing = order['pricing'] as Map<String, dynamic>?;
    final pkg = order['package'] as Map<String, dynamic>?;
    return TripHistoryItem(
      orderId: order['orderId'] as int,
      orderNumber:
          order['orderNumber'] as String? ?? '#${order['orderId']}',
      status: order['status'] as String? ?? 'delivered',
      netEarning: (order['earnings'] as num?)?.toDouble() ?? 0.0,
      baseFare: (pricing?['basePrice'] as num?)?.toDouble() ?? 0.0,
      distanceFee: (pricing?['distancePrice'] as num?)?.toDouble() ?? 0.0,
      tip: (order['tip'] as num?)?.toDouble() ?? 0.0,
      distanceKm: (order['distanceKm'] as num?)?.toDouble() ??
          (pricing?['distanceKm'] as num?)?.toDouble() ??
          0.0,
      pickupCity: pickup?['city'] as String?,
      pickupAddress: pickup?['fullAddress'] as String?,
      dropCity: delivery?['city'] as String?,
      dropAddress: delivery?['fullAddress'] as String?,
      packageType: pkg?['description'] as String?,
      completedAt:
          order['completedAt'] as String? ?? order['deliveredAt'] as String?,
      cancelledAt: order['cancelledAt'] as String?,
      returnedAt: order['returnedAt'] as String?,
      pickedUpAt: order['pickedUpAt'] as String?,
      assignedAt: order['assignedAt'] as String?,
      cancellationReason: order['cancellationReason'] as String?,
    );
  }
}

// ── App bar ───────────────────────────────────────────────────────────────────

class _TripAppBar extends StatelessWidget {
  const _TripAppBar({
    required this.trip,
    required this.orderId,
    required this.accentColor,
    required this.cs,
  });

  final TripHistoryItem? trip;
  final int orderId;
  final Color accentColor;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final ext = Theme.of(context).extension<AppThemeExtension>();

    return SliverAppBar(
      pinned: true,
      expandedHeight: 88,
      backgroundColor: cs.surface,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_rounded),
        onPressed: () => Navigator.of(context).pop(),
      ),
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: const EdgeInsets.fromLTRB(56, 0, 16, 14),
        title: Text(
          'Trip Details',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
        background: Container(
          decoration: BoxDecoration(
            gradient: ext?.primaryGradient ??
                LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [
                    accentColor.withValues(alpha: 0.10),
                    cs.surface,
                  ],
                ),
          ),
        ),
      ),
    );
  }
}

// ── Hero card ─────────────────────────────────────────────────────────────────

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.trip, required this.cs});

  final TripHistoryItem trip;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final status = trip.status;
    final accent = _statusAccent(status, cs);
    final bg = _statusBg(status, cs);
    final fmt = NumberFormat('#,##0.00', 'en_IN');
    final ts = _fmt(trip.effectiveTimestamp);

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
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
              Text(
                trip.orderNumber,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
              ),
              const SizedBox(width: 8),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  _statusLabel(status).toUpperCase(),
                  style: TextStyle(
                    color: accent,
                    fontSize: 9,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.7,
                  ),
                ),
              ),
            ],
          ),
          if (ts.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              ts,
              style: TextStyle(
                color: cs.onSurfaceVariant,
                fontSize: 11,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.2,
              ),
            ),
          ],
          const SizedBox(height: 14),
          if (trip.netEarning > 0) ...[
            Text(
              'NET EARNING',
              style: TextStyle(
                color: cs.onSurfaceVariant,
                fontSize: 10,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.8,
              ),
            ),
            const SizedBox(height: 2),
            RichText(
              text: TextSpan(
                children: [
                  TextSpan(
                    text: '₹',
                    style: TextStyle(
                      color: accent,
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  TextSpan(
                    text: fmt.format(trip.netEarning),
                    style: TextStyle(
                      color: accent,
                      fontSize: 36,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -1,
                      height: 1,
                    ),
                  ),
                ],
              ),
            ),
          ] else ...[
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: bg,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                trip.cancellationReason ?? 'No earnings recorded',
                style: TextStyle(
                  color: accent,
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Route card ────────────────────────────────────────────────────────────────

class _RouteCard extends StatelessWidget {
  const _RouteCard({required this.trip, required this.cs});

  final TripHistoryItem trip;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final distLabel = trip.distanceKm > 0
        ? 'Route · ${NumberFormat('#,##0.#').format(trip.distanceKm)} km'
        : 'Route';

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
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
          Text(
            distLabel.toUpperCase(),
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Track line
              Column(
                children: [
                  Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: cs.primary,
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: cs.primary.withValues(alpha: 0.3),
                          spreadRadius: 3,
                        ),
                      ],
                    ),
                  ),
                  Container(
                    width: 2,
                    height: 38,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          cs.primary.withValues(alpha: 0.4),
                          cs.error.withValues(alpha: 0.4),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: cs.error,
                      borderRadius: BorderRadius.circular(2),
                      boxShadow: [
                        BoxShadow(
                          color: cs.error.withValues(alpha: 0.3),
                          spreadRadius: 3,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 14),
              // Addresses
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _RouteStop(
                      label: 'PICKUP',
                      area: trip.pickupCity,
                      address: trip.pickupAddress,
                      cs: cs,
                    ),
                    const SizedBox(height: 18),
                    _RouteStop(
                      label: 'DROP',
                      area: trip.dropCity,
                      address: trip.dropAddress,
                      cs: cs,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _RouteStop extends StatelessWidget {
  const _RouteStop({
    required this.label,
    required this.area,
    required this.address,
    required this.cs,
  });

  final String label;
  final String? area;
  final String? address;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.6,
            ),
          ),
          if (area != null) ...[
            const SizedBox(height: 1),
            Text(
              area!,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.1,
              ),
            ),
          ],
          if (address != null && address != area) ...[
            const SizedBox(height: 2),
            Text(
              address!,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: cs.onSurfaceVariant,
                height: 1.4,
              ),
            ),
          ],
        ],
      );
}

// ── Customer card ─────────────────────────────────────────────────────────────

class _CustomerCard extends StatelessWidget {
  const _CustomerCard({required this.client, required this.cs});

  final Map<String, dynamic> client;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final firstName = client['firstName'] as String? ?? '';
    final lastName = client['lastName'] as String? ?? '';
    final name = '$firstName $lastName'.trim();
    final phone = client['phoneNumber'] as String?;
    if (name.isEmpty) {
      return const SizedBox.shrink();
    }
    final initials = name
        .split(' ')
        .where((p) => p.isNotEmpty)
        .map((p) => p[0].toUpperCase())
        .take(2)
        .join();

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: cs.outlineVariant.withValues(alpha: 0.12),
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: cs.primaryContainer,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: TextStyle(
                color: cs.onPrimaryContainer,
                fontSize: 14,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.1,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'CUSTOMER',
                  style: TextStyle(
                    color: cs.onSurfaceVariant,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (phone != null) ...[
                  const SizedBox(height: 1),
                  Text(
                    phone,
                    style: TextStyle(
                      color: cs.onSurfaceVariant,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Package card ──────────────────────────────────────────────────────────────

class _PackageCard extends StatelessWidget {
  const _PackageCard({required this.pkg, required this.cs});

  final Map<String, dynamic> pkg;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final description = pkg['description'] as String?;
    final weight = (pkg['weight'] as num?)?.toDouble();
    final notes = pkg['notes'] as String?;
    if (description == null && weight == null) {
      return const SizedBox.shrink();
    }

    final sub = [
      if (weight != null) '${NumberFormat('#,##0.#').format(weight)} kg',
      if (notes != null && notes.isNotEmpty) notes,
    ].join(' · ');

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: cs.outlineVariant.withValues(alpha: 0.12),
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: cs.primaryContainer.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(10),
            ),
            alignment: Alignment.center,
            child: Icon(
              Icons.inventory_2_outlined,
              color: cs.primary,
              size: 20,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'PACKAGE',
                  style: TextStyle(
                    color: cs.onSurfaceVariant,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.6,
                  ),
                ),
                const SizedBox(height: 2),
                if (description != null)
                  Text(
                    description,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                if (sub.isNotEmpty) ...[
                  const SizedBox(height: 1),
                  Text(
                    sub,
                    style: TextStyle(
                      color: cs.onSurfaceVariant,
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Timeline card ─────────────────────────────────────────────────────────────

class _TimelineCard extends StatelessWidget {
  const _TimelineCard({required this.trip, required this.cs});

  final TripHistoryItem trip;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final status = trip.status;
    final accent = _statusAccent(status, cs);
    final isCancelled = status == 'cancelled';
    final isReturned = status == 'returned' || status == 'undeliverable';

    final pickedUp = trip.pickedUpAt != null;
    final skippedPickup = isCancelled && !pickedUp;

    final steps = [
      _Step(
        label: 'Order Assigned',
        time: _fmt(trip.assignedAt),
        isDone: trip.assignedAt != null,
      ),
      _Step(
        label: 'Picked Up',
        time: skippedPickup ? 'Skipped' : _fmt(trip.pickedUpAt),
        isDone: pickedUp,
        isSkipped: skippedPickup,
      ),
      _Step(
        label: isCancelled
            ? 'Cancelled'
            : isReturned
                ? 'Returned'
                : 'Delivered',
        time: _fmt(trip.completedAt ?? trip.cancelledAt ?? trip.returnedAt),
        isDone: true,
        isFinal: true,
        finalColor: accent,
      ),
    ];

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
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
          Text(
            'TIMELINE',
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 14),
          ...steps.asMap().entries.map((e) => _TimelineRow(
                step: e.value,
                isLast: e.key == steps.length - 1,
                cs: cs,
              )),
          if (trip.cancellationReason != null) ...[
            const SizedBox(height: 6),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: _statusBg(status, cs),
                borderRadius: BorderRadius.circular(10),
              ),
              child: RichText(
                text: TextSpan(
                  style: TextStyle(
                    color: accent,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    height: 1.45,
                  ),
                  children: [
                    const TextSpan(
                      text: 'Reason: ',
                      style: TextStyle(fontWeight: FontWeight.w800),
                    ),
                    TextSpan(text: trip.cancellationReason),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Step {
  const _Step({
    required this.label,
    required this.time,
    required this.isDone,
    this.isSkipped = false,
    this.isFinal = false,
    this.finalColor,
  });

  final String label;
  final String time;
  final bool isDone;
  final bool isSkipped;
  final bool isFinal;
  final Color? finalColor;
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({
    required this.step,
    required this.isLast,
    required this.cs,
  });

  final _Step step;
  final bool isLast;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final dotColor = step.isSkipped
        ? cs.surfaceContainerHighest
        : step.isFinal
            ? (step.finalColor ?? cs.primary)
            : step.isDone
                ? cs.primary
                : cs.surfaceContainerHighest;

    final ringColor = step.isDone && !step.isSkipped
        ? (step.isFinal
            ? (step.finalColor ?? cs.primary).withValues(alpha: 0.2)
            : cs.primary.withValues(alpha: 0.15))
        : Colors.transparent;

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 26,
            child: Column(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  decoration: BoxDecoration(
                    color: dotColor,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: ringColor,
                        spreadRadius: 3,
                      ),
                    ],
                  ),
                  child: step.isDone && !step.isSkipped
                      ? const Icon(
                          Icons.check_rounded,
                          color: Colors.white,
                          size: 12,
                        )
                      : null,
                ),
                if (!isLast)
                  Expanded(
                    child: Center(
                      child: Container(
                        width: 2,
                        margin: const EdgeInsets.symmetric(vertical: 2),
                        color: step.isDone && !step.isSkipped
                            ? cs.primary.withValues(alpha: 0.2)
                            : cs.surfaceContainerHighest,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 18),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    step.label,
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.1,
                      color: step.isSkipped
                          ? cs.onSurfaceVariant
                          : step.isFinal
                              ? (step.finalColor ?? cs.onSurface)
                              : cs.onSurface,
                      decoration: step.isSkipped
                          ? TextDecoration.lineThrough
                          : null,
                    ),
                  ),
                  if (step.time.isNotEmpty)
                    Text(
                      step.time,
                      style: TextStyle(
                        fontSize: 11,
                        color: cs.onSurfaceVariant,
                        fontWeight: FontWeight.w500,
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

// ── Earnings breakdown card ───────────────────────────────────────────────────

class _EarningsBreakdownCard extends StatelessWidget {
  const _EarningsBreakdownCard({required this.trip, required this.cs});

  final TripHistoryItem trip;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0.00', 'en_IN');

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
      decoration: BoxDecoration(
        color: cs.surface,
        borderRadius: BorderRadius.circular(16),
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
          Text(
            'EARNINGS BREAKDOWN',
            style: TextStyle(
              color: cs.onSurfaceVariant,
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 12),
          _BreakdownRow(
            label: 'Base fare',
            value: '₹${fmt.format(trip.baseFare)}',
            cs: cs,
          ),
          if (trip.distanceKm > 0)
            _BreakdownRow(
              label:
                  'Distance · ${NumberFormat('#,##0.#').format(trip.distanceKm)} km',
              value: '₹${fmt.format(trip.distanceFee)}',
              cs: cs,
            ),
          if (trip.tip > 0)
            _BreakdownRow(
              label: 'Tip',
              value: '₹${fmt.format(trip.tip)}',
              cs: cs,
            ),
          const SizedBox(height: 8),
          Divider(height: 1, color: cs.outlineVariant),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                'Net Earning',
                style: TextStyle(
                  color: cs.onSurface,
                  fontSize: 13,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.2,
                ),
              ),
              const Spacer(),
              Text(
                '₹${fmt.format(trip.netEarning)}',
                style: TextStyle(
                  color: cs.primary,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.2,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  const _BreakdownRow({
    required this.label,
    required this.value,
    required this.cs,
  });

  final String label;
  final String value;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 9),
        child: Row(
          children: [
            Text(
              label,
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            const Spacer(),
            Text(
              value,
              style: TextStyle(
                color: cs.onSurface,
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      );
}

// ── Report button ─────────────────────────────────────────────────────────────

class _ReportButton extends StatelessWidget {
  const _ReportButton({required this.cs});

  final ColorScheme cs;

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 54,
        child: OutlinedButton.icon(
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Help request sent')),
            );
          },
          style: OutlinedButton.styleFrom(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            side: BorderSide(color: cs.outlineVariant),
          ),
          icon: Icon(Icons.help_outline_rounded, size: 18, color: cs.primary),
          label: Text(
            'Report an issue',
            style: TextStyle(
              color: cs.onSurface,
              fontSize: 14,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.1,
            ),
          ),
        ),
      );
}

// ── Skeleton for customer + package (shown while order loads) ─────────────────

class _CustomerPackageSkeleton extends StatelessWidget {
  const _CustomerPackageSkeleton({required this.cs});

  final ColorScheme cs;

  Widget _box(double w, double h) => Container(
        width: w,
        height: h,
        decoration: BoxDecoration(
          color: cs.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(6),
        ),
      );

  Widget _shimCard(List<Widget> children) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: cs.outlineVariant.withValues(alpha: 0.12),
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(children: children),
      );

  @override
  Widget build(BuildContext context) => Column(
        children: [
          _shimCard([
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _box(60, 10),
                const SizedBox(height: 6),
                _box(130, 14),
                const SizedBox(height: 4),
                _box(100, 10),
              ],
            ),
          ]),
          const SizedBox(height: 10),
          _shimCard([
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            const SizedBox(width: 14),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _box(50, 10),
                const SizedBox(height: 6),
                _box(110, 14),
                const SizedBox(height: 4),
                _box(80, 10),
              ],
            ),
          ]),
          const SizedBox(height: 10),
        ],
      );
}

// ── Small inline error ────────────────────────────────────────────────────────

class _SmallError extends StatelessWidget {
  const _SmallError({required this.onRetry, required this.cs});

  final VoidCallback onRetry;
  final ColorScheme cs;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Icon(Icons.error_outline_rounded, color: cs.error, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Could not load trip details.',
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
              ),
            ),
            TextButton(
              onPressed: onRetry,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
}
