import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../models/daily_stats.dart';
import '../../providers/home_provider.dart';

class EarningsScreen extends ConsumerWidget {
  const EarningsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dailyStatsProvider);
    final tripsAsync = ref.watch(tripHistoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Earnings')),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(driverDashboardDataProvider);
          ref.invalidate(tripHistoryProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            statsAsync.when(
              data: (stats) => _EarningsSummary(stats: stats),
              loading: () => const SizedBox(height: 120, child: Center(child: CircularProgressIndicator())),
              error: (e, _) => Text('Failed to load earnings: $e'),
            ),
            const SizedBox(height: 24),
            Text('Trip History', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            tripsAsync.when(
              data: (trips) => trips.isEmpty
                  ? const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: Text('No trips yet')),
                    )
                  : Column(children: trips.map((t) => _TripCard(trip: t)).toList()),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, _) => Text('Failed to load trips: $e'),
            ),
          ],
        ),
      ),
    );
  }
}

class _EarningsSummary extends StatelessWidget {
  const _EarningsSummary({required this.stats});

  final DailyStats stats;

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat.currency(symbol: '₹', decimalDigits: 2);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Text("Today's Earnings", style: Theme.of(context).textTheme.labelLarge),
                const SizedBox(height: 8),
                Text(fmt.format(stats.earnings), style: Theme.of(context).textTheme.displaySmall),
                const SizedBox(height: 4),
                Text('${stats.trips} deliveries today', style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(child: _StatCard(label: 'This Week', value: fmt.format(stats.weeklyEarnings))),
            const SizedBox(width: 12),
            Expanded(child: _StatCard(label: 'All Time', value: fmt.format(stats.totalEarnings))),
          ],
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) => Card(
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          const SizedBox(height: 4),
          Text(value, style: Theme.of(context).textTheme.titleMedium),
        ],
      ),
    ),
  );
}

class _TripCard extends StatelessWidget {
  const _TripCard({required this.trip});

  final Map<String, dynamic> trip;

  @override
  Widget build(BuildContext context) {
    final orderId = trip['orderId'];
    final orderNumber = trip['orderNumber'] as String? ?? '#$orderId';
    final status = trip['status'] as String? ?? 'unknown';
    final earnings = (trip['earnings'] as num?)?.toDouble() ?? 0.0;
    final delivery = trip['delivery'] as Map<String, dynamic>?;
    final address = delivery?['fullAddress'] as String? ?? 'Unknown address';
    final completedAt = trip['completedAt'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _statusColor(status).withValues(alpha: 0.1),
          child: Icon(_statusIcon(status), color: _statusColor(status), size: 20),
        ),
        title: Text(orderNumber),
        subtitle: Text(address, maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text('₹${earnings.toStringAsFixed(2)}', style: Theme.of(context).textTheme.labelLarge),
            if (completedAt != null) Text(_formatDate(completedAt), style: Theme.of(context).textTheme.labelSmall),
          ],
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'delivered':
        return Colors.green;
      case 'returned':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'delivered':
        return Icons.check_circle_outline;
      case 'returned':
        return Icons.undo_outlined;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.help_outline;
    }
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return DateFormat('MMM d, h:mm a').format(dt);
    } catch (_) {
      return '';
    }
  }
}
