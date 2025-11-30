import 'package:flutter/material.dart';
import 'package:shipzy_driver/widgets/map_widget.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // final driverTheme = theme.extension<DriverThemeExtension>(); // Removed incorrect usage

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: [
          Switch(
            value: true, // TODO: Connect to online/offline state
            onChanged: (value) {},
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              _buildStatsCard(theme),
              const SizedBox(height: 24),
              SizedBox(
                height: 200,
                child: ClipRRect(borderRadius: BorderRadius.circular(12), child: const MapWidget()),
              ),
              const SizedBox(height: 24),
              Text('Available Orders', style: theme.textTheme.titleLarge), const SizedBox(height: 16),
              _buildOrderCard(context),
              // Add more order cards or empty state
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatsCard(ThemeData theme) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [_buildStatItem(theme, 'Today', '\$120.50'), _buildStatItem(theme, 'Orders', '5'), _buildStatItem(theme, 'Hours', '4.5')],
        ),
      ),
    );
  }

  Widget _buildStatItem(ThemeData theme, String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
        ),
        Text(label, style: theme.textTheme.bodySmall),
      ],
    );
  }

  Widget _buildOrderCard(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Order #12345', style: TextStyle(fontWeight: FontWeight.bold)),
                Text(
                  '\$15.00',
                  style: TextStyle(fontWeight: FontWeight.bold, color: Theme.of(context).colorScheme.primary),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Row(children: [Icon(Icons.location_on_outlined, size: 16), SizedBox(width: 4), Text('Pickup: 123 Main St')]),
            const SizedBox(height: 4),
            const Row(children: [Icon(Icons.flag_outlined, size: 16), SizedBox(width: 4), Text('Dropoff: 456 Elm St')]),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(onPressed: () {}, child: const Text('Reject')),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(onPressed: () {}, child: const Text('Accept')),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
