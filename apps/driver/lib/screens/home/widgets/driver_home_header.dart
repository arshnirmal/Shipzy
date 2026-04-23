import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/home_provider.dart';
import '../../../theme/app_theme_extension.dart';

class DriverHomeHeader extends ConsumerWidget {
  const DriverHomeHeader({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(driverProfileProvider);
    final theme = Theme.of(context);
    final themeExt = theme.extension<AppThemeExtension>();

    // Fallbacks
    final name =
        profileAsync.valueOrNull?.fullName.split(' ').first ?? 'Driver';
    final rating = profileAsync.valueOrNull?.rating?.averageRating ?? 5.0;

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 14),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withValues(
          alpha: themeExt?.glassmorphismOpacity ?? 0.88,
        ),
        boxShadow: [
          if (themeExt?.ambientShadow != null) themeExt!.ambientShadow,
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: themeExt?.primaryGradient,
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.person, color: Colors.white),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Good morning 👋',
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
                Text(name, style: theme.textTheme.titleMedium),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              children: [
                const Icon(Icons.star, color: Colors.orange, size: 14),
                const SizedBox(width: 4),
                Text(
                  rating.toStringAsFixed(1),
                  style: theme.textTheme.labelMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerLow,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              Icons.notifications_outlined,
              color: theme.colorScheme.onSurface,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}
