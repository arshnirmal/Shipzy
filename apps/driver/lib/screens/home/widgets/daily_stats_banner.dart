import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/driver_home_state.dart';
import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';

class DailyStatsBanner extends ConsumerWidget {
  const DailyStatsBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dailyStatsProvider);
    final status = ref.watch(driverStatusProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final isOnline = status != DriverStatus.offline;
    final earnings = statsAsync.valueOrNull?.earnings ?? 0.0;
    final trips = statsAsync.valueOrNull?.trips ?? 0;

    final onlineColor =
        isDark ? AppPalette.onlineDark : AppPalette.onlineLight;
    final earningsColor =
        isDark ? AppPalette.earningsPositiveDark : AppPalette.earningsPositiveLight;

    return Container(
      margin: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            _StatTile(
              icon: Icons.account_balance_wallet_outlined,
              iconColor: earningsColor,
              label: 'EARNINGS',
              value: '₹${earnings.toStringAsFixed(0)}',
              valueColor: earningsColor,
            ),
            VerticalDivider(
              width: 1,
              thickness: 1,
              color: theme.colorScheme.outlineVariant,
            ),
            _StatTile(
              icon: Icons.local_shipping_outlined,
              iconColor: theme.colorScheme.primary,
              label: 'TRIPS',
              value: trips.toString(),
            ),
            VerticalDivider(
              width: 1,
              thickness: 1,
              color: theme.colorScheme.outlineVariant,
            ),
            _StatTile(
              icon: isOnline
                  ? Icons.radio_button_checked_rounded
                  : Icons.radio_button_unchecked_rounded,
              iconColor: isOnline
                  ? onlineColor
                  : theme.colorScheme.onSurfaceVariant,
              label: 'STATUS',
              value: isOnline ? 'Online' : 'Offline',
              valueColor: isOnline ? onlineColor : null,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.iconColor,
    required this.label,
    required this.value,
    this.valueColor,
  });

  final IconData icon;
  final Color iconColor;
  final String label;
  final String value;
  final Color? valueColor;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
        child: Row(
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(icon, color: iconColor, size: 16),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                      fontSize: 9,
                      letterSpacing: 0.5,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 1),
                  Text(
                    value,
                    style: theme.textTheme.labelLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: valueColor ?? theme.colorScheme.onSurface,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
