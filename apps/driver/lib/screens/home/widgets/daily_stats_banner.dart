import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/driver_home_state.dart';
import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';
import '../../../theme/app_theme_extension.dart';

class DailyStatsBanner extends ConsumerWidget {
  const DailyStatsBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dailyStatsProvider);
    final status = ref.watch(driverStatusProvider);

    final theme = Theme.of(context);
    final themeExt = theme.extension<AppThemeExtension>();
    final isDark = theme.brightness == Brightness.dark;

    final isOnline = status != DriverStatus.offline;
    final earnings = statsAsync.valueOrNull?.earnings ?? 0.0;
    final trips = statsAsync.valueOrNull?.trips ?? 0;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 18),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withValues(
          alpha: themeExt?.glassmorphismOpacity ?? 0.92,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          if (themeExt?.ambientShadow != null) themeExt!.ambientShadow,
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'TODAY\'S EARNINGS',
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                RichText(
                  text: TextSpan(
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
                    children: [
                      TextSpan(
                        text: '₹',
                        style: theme.textTheme.labelMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      TextSpan(text: earnings.toStringAsFixed(2)),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 38,
            color: theme.colorScheme.surfaceContainerHigh,
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'TRIPS TODAY',
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  trips.toString(),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ],
            ),
          ),
          Container(
            width: 1,
            height: 38,
            color: theme.colorScheme.surfaceContainerHigh,
            margin: const EdgeInsets.symmetric(horizontal: 16),
          ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'STATUS',
                  style: theme.textTheme.labelSmall?.copyWith(
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isOnline
                            ? (isDark
                                  ? AppPalette.onlineDark
                                  : AppPalette.onlineLight)
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isOnline ? 'Online' : 'Offline',
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: isOnline
                            ? (isDark
                                  ? AppPalette.onlineDark
                                  : AppPalette.onlineLight)
                            : theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
