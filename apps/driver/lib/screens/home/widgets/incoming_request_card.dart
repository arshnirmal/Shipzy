import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';
import 'swipe_to_accept.dart';

class IncomingRequestCard extends ConsumerWidget {
  const IncomingRequestCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final nearbyOrdersAsync = ref.watch(nearbyOrdersProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final orders = nearbyOrdersAsync.valueOrNull ?? [];
    if (orders.isEmpty) {
      return const SizedBox.shrink();
    }

    final order = orders.first;

    final tripDistanceKm = order.order.metrics.estimatedDistanceKm;
    final packageDescription = order.order.package.description;
    final driverDistanceKm = order.distanceFromDriverKm;
    final estimatedMins = order.order.metrics.actualDurationMins ??
        (driverDistanceKm * 3).round();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
            blurRadius: 40,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header: badge + earnings / driver distance + time
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppPalette.darkTertiaryContainer
                            : AppPalette.lightTertiaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'NEW REQUEST',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: isDark
                              ? AppPalette.darkOnTertiaryContainer
                              : AppPalette.lightOnTertiaryContainer,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    RichText(
                      text: TextSpan(
                        style: theme.textTheme.displaySmall?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: theme.colorScheme.onSurface,
                        ),
                        children: [
                          TextSpan(
                            text: '₹',
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          TextSpan(
                            text: order.order.pricing.totalPrice
                                .toStringAsFixed(0),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.directions_car_filled_outlined,
                          size: 16,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${driverDistanceKm.toStringAsFixed(1)} km away',
                          style: theme.textTheme.labelLarge,
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(
                          Icons.access_time,
                          size: 16,
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '~$estimatedMins min',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Metrics chips: trip distance, package, driver distance
            Row(
              children: [
                _MetricChip(
                  label: 'TRIP',
                  value: tripDistanceKm != null
                      ? '${tripDistanceKm.toStringAsFixed(1)} km'
                      : '—',
                ),
                const SizedBox(width: 8),
                _MetricChip(
                  label: 'PACKAGE',
                  value: packageDescription ?? 'Package',
                ),
                const SizedBox(width: 8),
                _MetricChip(
                  label: 'FROM YOU',
                  value: '${driverDistanceKm.toStringAsFixed(1)} km',
                ),
              ],
            ),

            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 20),

            // Route: pickup → delivery
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: theme.colorScheme.primary,
                          width: 3,
                        ),
                      ),
                    ),
                    Container(
                      width: 2,
                      height: 32,
                      color: theme.colorScheme.surfaceContainerHigh,
                    ),
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isDark
                            ? AppPalette.darkTertiary
                            : AppPalette.lightTertiary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.order.locations.pickup.fullAddress,
                        style: theme.textTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 24),
                      Text(
                        order.order.locations.delivery.fullAddress,
                        style: theme.textTheme.titleMedium,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),

            const SizedBox(height: 28),

            SwipeToAccept(
              onAccept: () => ref
                  .read(driverHomeProvider.notifier)
                  .acceptOrder(order.order.identifiers.orderId),
            ),

            const SizedBox(height: 12),

            TextButton(
              onPressed: () => ref
                  .read(driverHomeProvider.notifier)
                  .rejectOrder(order.order.identifiers.orderId),
              child: Text(
                'DECLINE',
                style: theme.textTheme.labelLarge?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                  letterSpacing: 1.2,
                ),
              ),
            ),

            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }
}

// ── Metric chip ───────────────────────────────────────────────────

class _MetricChip extends StatelessWidget {
  const _MetricChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 10),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerLow,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                letterSpacing: 0.5,
                fontWeight: FontWeight.w700,
                fontSize: 9,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: theme.textTheme.labelMedium?.copyWith(
                fontWeight: FontWeight.w700,
                color: theme.colorScheme.onSurface,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
