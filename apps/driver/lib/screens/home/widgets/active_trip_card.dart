import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/order_types.dart';
import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';

class ActiveTripCard extends ConsumerWidget {
  const ActiveTripCard({super.key});

  Future<void> _launchGoogleMaps(double lat, double lng) async {
    final url = Uri.parse('google.navigation:q=$lat,$lng');
    if (await canLaunchUrl(url)) {
      await launchUrl(url);
    } else {
      final webUrl = Uri.parse(
        'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
      );
      if (await canLaunchUrl(webUrl)) {
        await launchUrl(webUrl);
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeOrderAsync = ref.watch(activeOrderProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final order = activeOrderAsync.valueOrNull;
    if (order == null) {
      return const SizedBox.shrink();
    }

    final isEnRouteToPickup =
        order.assignmentStatus.order == AssignmentOrderStatus.accepted;

    // Determine the target destination coordinates based on the status
    final pickup = order.routing.pickup;
    final dropoff = order.routing.delivery;

    final targetLat = isEnRouteToPickup
        ? pickup?.latitude ?? 0.0
        : dropoff?.latitude ?? 0.0;
    final targetLng = isEnRouteToPickup
        ? pickup?.longitude ?? 0.0
        : dropoff?.longitude ?? 0.0;
    final targetAddress = isEnRouteToPickup
        ? pickup?.fullAddress ?? 'Unknown'
        : dropoff?.fullAddress ?? 'Unknown';

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
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: isDark
                      ? AppPalette.darkPrimaryContainer
                      : AppPalette.lightPrimaryContainer,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isEnRouteToPickup ? 'PICKUP' : 'DROPOFF',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Row(
                children: [
                  Icon(
                    Icons.directions_car,
                    size: 16,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isEnRouteToPickup ? 'Head to store' : 'Head to customer',
                    style: theme.textTheme.labelMedium?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            targetAddress,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w700,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _launchGoogleMaps(targetLat, targetLng),
                  icon: const Icon(Icons.navigation),
                  label: const Text('Navigate'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: FilledButton.icon(
                  onPressed: () {
                    // Update order status action logic
                    // Ref.read(...)
                  },
                  icon: Icon(
                    isEnRouteToPickup
                        ? Icons.storefront
                        : Icons.check_circle_outline,
                  ),
                  label: Text(isEnRouteToPickup ? 'Arrived' : 'Complete'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
