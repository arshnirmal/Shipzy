import 'package:flutter/material.dart';

import '../../../models/daily_stats.dart';

class StatsGrid extends StatelessWidget {
  const StatsGrid({required this.stats, super.key});
  final DailyStats stats;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 16),
    child: Row(
      children: [
        Expanded(
          child: _buildStatCard(
            context,
            '💰 Earnings',
            '₹${stats.earnings.toStringAsFixed(0)}',
            stats.lastEarning > 0 ? '+₹${stats.lastEarning.toStringAsFixed(0)}' : null,
            Icons.attach_money,
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            '📦 Trips',
            stats.trips.toString(),
            stats.averageRating > 0 ? '⭐ ${stats.averageRating.toStringAsFixed(1)}' : null,
            Icons.local_shipping,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            '⏱️ Online',
            '${stats.onlineTime.inHours}h ${stats.onlineTime.inMinutes.remainder(60)}m',
            '🎯 Active',
            Icons.timer,
            Colors.orange,
          ),
        ),
      ],
    ),
  );

  Widget _buildStatCard(BuildContext context, String label, String value, String? secondaryValue, IconData icon, Color color) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade200),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        if (secondaryValue != null) ...[
          const SizedBox(height: 4),
          Text(
            secondaryValue,
            style: TextStyle(
              fontSize: 11,
              color: color.withOpacity(0.8),
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    ),
  );
}
