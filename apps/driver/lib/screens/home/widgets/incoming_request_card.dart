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

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.08),
            blurRadius: 32,
            offset: const Offset(0, 16),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header with Earnings and Distance
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
                      ),
                      children: [
                        TextSpan(
                          text: '₹',
                          style: theme.textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        TextSpan(
                          text: order.order.pricing.totalPrice.toStringAsFixed(
                            2,
                          ),
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
                        '${order.distanceFromDriverKm.toStringAsFixed(1)} km',
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
                        '~${order.order.metrics.actualDurationMins ?? (order.distanceFromDriverKm * 3).round()} min',
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

          const SizedBox(height: 24),
          const Divider(height: 1),
          const SizedBox(height: 24),

          // Locations
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

          const SizedBox(height: 32),

          // Swipe to accept
          SwipeToAccept(
            onAccept: () {
              ref
                  .read(driverHomeProvider.notifier)
                  .acceptOrder(order.order.identifiers.orderId);
            },
          ),

          const SizedBox(height: 16),

          // Reject button
          TextButton(
            onPressed: () {
              ref
                  .read(driverHomeProvider.notifier)
                  .rejectOrder(order.order.identifiers.orderId);
            },
            child: Text(
              'DECLINE',
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
                letterSpacing: 1.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
