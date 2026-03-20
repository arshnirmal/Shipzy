import 'package:flutter/material.dart';

import '../../../models/driver_home_state.dart';

class StatusCard extends StatelessWidget {
  const StatusCard({
    required this.status,
    required this.onToggle,
    super.key,
    this.isLoading = false,
    this.driverName,
    this.location,
    this.onlineDuration,
  });

  final DriverStatus status;
  final VoidCallback onToggle;
  final bool isLoading;
  final String? driverName;
  final String? location;
  final Duration? onlineDuration;

  @override
  Widget build(BuildContext context) {
    final isOnline = status == DriverStatus.online;
    final theme = Theme.of(context);

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: theme.dividerColor),
      ),
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Greeting
            if (driverName != null) Text('👋 Good Morning, $driverName!', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 16),

            // Status Text
            Text(
              isOnline ? 'You are currently ONLINE\nWaiting for orders...' : 'You are currently OFFLINE\nGo online to start receiving orders',
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.textTheme.bodyMedium?.color, height: 1.5),
            ),
            const SizedBox(height: 24),

            // Large Toggle Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isLoading ? null : onToggle,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isOnline ? theme.colorScheme.error : theme.colorScheme.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(isOnline ? Icons.power_settings_new : Icons.play_circle_fill),
                          const SizedBox(width: 12),
                          Text(isOnline ? 'GO OFFLINE' : 'GO ONLINE', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                        ],
                      ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
