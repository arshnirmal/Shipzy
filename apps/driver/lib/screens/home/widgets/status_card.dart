import 'package:flutter/material.dart';

import '../../../models/driver_home_state.dart';

class StatusCard extends StatelessWidget {
  const StatusCard({required this.status, required this.onToggle, super.key, this.isLoading = false});
  final DriverStatus status;
  final VoidCallback onToggle;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final isOnline = status == DriverStatus.online;
    final theme = Theme.of(context);

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(isOnline ? Icons.circle : Icons.circle_outlined, color: isOnline ? Colors.green : Colors.red, size: 16),
                const SizedBox(width: 8),
                Text(
                  isOnline ? 'ONLINE • AVAILABLE' : 'OFFLINE',
                  style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: isOnline ? Colors.green : Colors.red),
                ),
              ],
            ),
            const Divider(height: 24),
            Text(
              isOnline ? 'Searching for nearby orders...' : 'You are currently OFFLINE\nGo online to start receiving orders',
              style: theme.textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: isLoading ? null : onToggle,
                style: ElevatedButton.styleFrom(
                  backgroundColor: isOnline ? Colors.red : Colors.green,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: isLoading
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                      )
                    : Text(isOnline ? 'GO OFFLINE' : 'GO ONLINE', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
