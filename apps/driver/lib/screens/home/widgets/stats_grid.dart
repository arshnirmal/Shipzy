import 'package:flutter/material.dart';

import '../../../models/daily_stats.dart';

class StatsGrid extends StatelessWidget {
  const StatsGrid({required this.stats, super.key});
  final DailyStats stats;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text("Today's Summary", style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: theme.cardColor,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.dividerColor),
            ),
            child: Row(
              children: [
                Expanded(child: _buildStatItem(context, '💰 Earnings', '₹${stats.earnings.toStringAsFixed(0)}')),
                Container(width: 1, height: 40, color: theme.dividerColor),
                Expanded(child: _buildStatItem(context, '📦 Deliveries', stats.trips.toString())),
                Container(width: 1, height: 40, color: theme.dividerColor),
                Expanded(child: _buildStatItem(context, '⏱️ Hours', '${stats.onlineTime.inHours}h ${stats.onlineTime.inMinutes.remainder(60)}m')),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    return Column(
      children: [
        Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.textTheme.bodySmall?.color)),
        const SizedBox(height: 8),
        Text(value, style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
      ],
    );
  }
}
