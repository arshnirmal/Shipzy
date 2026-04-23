import 'package:flutter/material.dart';

import '../../../models/daily_stats.dart';

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({required this.stats, super.key});

  final DailyStats stats;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // TODO(shipzy): Get weekly target from settings/config.
    const weeklyTarget = 50;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text(
            'Recent Activity',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            children: [
              _buildActivityRow(
                context,
                '📊 Yesterday\'s Earnings',
                '₹${stats.totalEarnings.toStringAsFixed(0)}',
              ), // Using total as placeholder
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Divider(),
              ),
              _buildActivityRow(
                context,
                '🏆 Weekly Target',
                '${stats.weeklyTrips}/$weeklyTarget deliveries',
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Divider(),
              ),
              _buildActivityRow(
                context,
                '⭐ Current Rating',
                '${stats.averageRating.toStringAsFixed(1)} (${stats.totalTrips} trips)',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActivityRow(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyMedium),
        Text(
          value,
          style: theme.textTheme.bodyMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
