// lib/screens/home/widgets/recent_activity_section.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/address_provider.dart';
import '../../../theme/design_tokens.dart';

class RecentLocationsSection extends ConsumerWidget {
  const RecentLocationsSection({super.key});

  IconData _getIconForLabel(String label) {
    final lowerLabel = label.toLowerCase();
    if (lowerLabel.contains('home')) return Icons.home_rounded;
    if (lowerLabel.contains('work') || lowerLabel.contains('office')) return Icons.work_rounded;
    if (lowerLabel.contains('mom') || lowerLabel.contains('dad') || lowerLabel.contains('family')) return Icons.favorite_rounded;
    return Icons.location_on_rounded;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final addressesState = ref.watch(savedAddressesNotifierProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.xs),
          child: Text('Recent Locations', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: AppSpacing.xs),

        // Horizontal Scrollable Locations
        SizedBox(
          height: 120, // Match design
          child: addressesState.when(
            data: (addresses) {
              if (addresses.isEmpty) {
                return Center(
                  child: Text('No saved locations yet', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                );
              }

              // Sort by newest first and take top 5
              final recentAddresses = List.of(addresses)..sort((a, b) => (b.createdAt ?? DateTime.now()).compareTo(a.createdAt ?? DateTime.now()));
              final displayAddresses = recentAddresses.take(5).toList();

              return ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                scrollDirection: Axis.horizontal,
                itemCount: displayAddresses.length,
                separatorBuilder: (context, index) => const SizedBox(width: AppSpacing.md),
                itemBuilder: (context, index) {
                  final address = displayAddresses[index];
                  return _LocationCard(
                    icon: _getIconForLabel(address.label ?? address.addressType ?? 'other'),
                    title: address.label?.isNotEmpty ?? false ? address.label! : 'Location ${index + 1}',
                    subtitle: address.fullAddress,
                    onTap: () {},
                  );
                },
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(
              child: Text('Failed to load locations', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.error)),
            ),
          ),
        ),
      ],
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard({required this.icon, required this.title, required this.subtitle, required this.onTap});

  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Material(
      color: theme.colorScheme.surface,
      borderRadius: AppRadius.radiusLg,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadius.radiusLg,
        child: Container(
          width: 144, // 36 * 4 approx
          padding: const EdgeInsets.all(AppSpacing.md),
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.5)),
            borderRadius: AppRadius.radiusLg,
            boxShadow: AppDepth.ambientShadow(theme.brightness),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 20, color: theme.colorScheme.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant, fontSize: 11),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
