// lib/screens/home/widgets/custom_home_app_bar.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/location_provider.dart';
import '../../../theme/design_tokens.dart';
import 'location_sector_bottomsheet.dart';

class CustomHomeAppBar extends ConsumerWidget implements PreferredSizeWidget {
  const CustomHomeAppBar({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final locationState = ref.watch(locationNotifierProvider);

    return AppBar(
      backgroundColor: theme.colorScheme.surfaceContainer,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      automaticallyImplyLeading: false,
      centerTitle: false,
      titleSpacing: AppSpacing.md,
      title: _LocationBlock(locationState: locationState, theme: theme),
      actions: [
        _NotificationButton(theme: theme),
        const SizedBox(width: AppSpacing.sm),
      ],
    );
  }
}

class _LocationBlock extends StatelessWidget {
  const _LocationBlock({required this.locationState, required this.theme});

  final AsyncValue locationState;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) => InkWell(
        onTap: () => showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (_) => const LocationSelectorSheet(),
        ),
        borderRadius: AppRadius.radiusLg,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary.withValues(alpha: 0.1),
                  borderRadius: AppRadius.radiusLg,
                ),
                child: Icon(Icons.location_on_rounded, color: theme.colorScheme.primary, size: 18),
              ),
              const SizedBox(width: AppSpacing.xs),
              Flexible(child: _LocationText(locationState: locationState, theme: theme)),
            ],
          ),
        ),
      );
}

class _LocationText extends StatelessWidget {
  const _LocationText({required this.locationState, required this.theme});

  final AsyncValue locationState;
  final ThemeData theme;

  @override
  Widget build(BuildContext context) => locationState.when(
        data: (location) {
          if (location == null) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Delivering from',
                  style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Set pickup location',
                      style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.primary),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: theme.colorScheme.primary),
                  ],
                ),
              ],
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Delivering from',
                style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
              ),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Flexible(
                    child: Text(
                      location.label ?? 'Current Location',
                      style: theme.textTheme.titleSmall,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 1,
                    ),
                  ),
                  const SizedBox(width: 2),
                  Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: theme.colorScheme.onSurface),
                ],
              ),
            ],
          );
        },
        loading: () => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Delivering from',
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 4),
            SizedBox(
              height: 10,
              width: 120,
              child: LinearProgressIndicator(
                borderRadius: AppRadius.radiusLg,
                backgroundColor: theme.colorScheme.surfaceContainerHigh,
              ),
            ),
          ],
        ),
        error: (_, _) => Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Delivering from',
              style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Location unavailable',
                  style: theme.textTheme.titleSmall?.copyWith(color: theme.colorScheme.error),
                ),
                const SizedBox(width: 2),
                Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: theme.colorScheme.error),
              ],
            ),
          ],
        ),
      );
}

class _NotificationButton extends StatelessWidget {
  const _NotificationButton({required this.theme});

  final ThemeData theme;

  @override
  Widget build(BuildContext context) => Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: theme.colorScheme.surfaceContainerLow,
              border: Border.all(
                color: theme.colorScheme.outlineVariant.withValues(alpha: AppDepth.ghostBorderOpacity),
              ),
            ),
            child: IconButton(
              padding: EdgeInsets.zero,
              onPressed: () {
                // TODO(arshnirmal): Navigate to notifications screen
              },
              icon: Icon(Icons.notifications_outlined, size: 20, color: theme.colorScheme.onSurfaceVariant),
            ),
          ),
          Positioned(
            right: 5,
            top: 5,
            child: Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                color: theme.colorScheme.error,
                shape: BoxShape.circle,
                border: Border.all(color: theme.colorScheme.surfaceContainer, width: 1.5),
              ),
            ),
          ),
        ],
      );
}
