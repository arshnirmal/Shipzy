import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/driver_home_state.dart';
import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';
import '../../../theme/app_theme_extension.dart';

class OnlineStatusToggle extends ConsumerWidget {
  const OnlineStatusToggle({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final status = ref.watch(driverStatusProvider);
    final isOnline = status != DriverStatus.offline;

    final theme = Theme.of(context);
    final themeExt = theme.extension<AppThemeExtension>();
    final isDark = theme.brightness == Brightness.dark;

    return IgnorePointer(
      ignoring: status == DriverStatus.onDelivery,
      child: AnimatedOpacity(
        opacity: status == DriverStatus.onDelivery ? 0.0 : 1.0,
        duration: const Duration(milliseconds: 300),
        child: GestureDetector(
          onTap: () {
            ref.read(driverHomeProvider.notifier).toggleStatus();
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
            decoration: BoxDecoration(
              gradient: isOnline ? null : themeExt?.primaryGradient,
              color: isOnline ? theme.colorScheme.surface : null,
              border: isOnline
                  ? Border.all(
                      color: theme.colorScheme.surfaceContainerHigh,
                      width: 2,
                    )
                  : null,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                if (!isOnline && themeExt?.ambientShadow != null)
                  themeExt!.ambientShadow,
                if (isOnline)
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: isOnline
                        ? (isDark
                              ? AppPalette.onlineDark
                              : AppPalette.onlineLight)
                        : Colors.white.withValues(alpha: 0.6),
                  ),
                ),
                const SizedBox(width: 10),
                Text(
                  isOnline ? 'Go Offline' : 'Go Online',
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: isOnline
                        ? theme.colorScheme.onSurfaceVariant
                        : Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
