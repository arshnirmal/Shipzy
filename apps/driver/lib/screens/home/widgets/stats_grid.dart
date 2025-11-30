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
        Expanded(child: _buildStatCard(context, 'Earnings', '₹${stats.earnings.toStringAsFixed(0)}', Icons.attach_money, Colors.green)),
        const SizedBox(width: 12),
        Expanded(child: _buildStatCard(context, 'Trips', stats.trips.toString(), Icons.local_shipping, Colors.blue)),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            context,
            'Online',
            '${stats.onlineTime.inHours}h ${stats.onlineTime.inMinutes.remainder(60)}m',
            Icons.timer,
            Colors.orange,
          ),
        ),
      ],
    ),
  );

  Widget _buildStatCard(BuildContext context, String label, String value, IconData icon, Color color) => Container(
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade200),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2))],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
      ],
    ),
  );
}
