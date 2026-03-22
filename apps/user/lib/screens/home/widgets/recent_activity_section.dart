// lib/screens/home/widgets/recent_activity_section.dart

import 'package:flutter/material.dart';

class RecentLocationsSection extends StatelessWidget {
  const RecentLocationsSection({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text('Recent Locations', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
        ),
        const SizedBox(height: 8),

        // Horizontal Scrollable Locations
        SizedBox(
          height: 120, // Match design
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            scrollDirection: Axis.horizontal,
            children: [
              _LocationCard(icon: Icons.home_rounded, title: 'Home', subtitle: '123 Main St', onTap: () {}),
              const SizedBox(width: 16),
              _LocationCard(icon: Icons.work_rounded, title: 'Office', subtitle: '789 Tech Park', onTap: () {}),
              const SizedBox(width: 16),
              _LocationCard(icon: Icons.favorite_rounded, title: "Mom's", subtitle: '456 Elm St', onTap: () {}),
            ],
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
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          width: 144, // 36 * 4 approx
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outline.withValues(alpha: 0.5)),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2))],
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
              const SizedBox(height: 12),
              Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
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
