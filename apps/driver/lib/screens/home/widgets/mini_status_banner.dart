import 'package:flutter/material.dart';

import '../../../models/driver_home_state.dart';

class MiniStatusBanner extends StatelessWidget {
  const MiniStatusBanner({required this.status, required this.onToggle, super.key, this.isLoading = false});

  final DriverStatus status;
  final VoidCallback onToggle;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final isOnline = status == DriverStatus.online;
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final onlineColor = isDark ? Colors.greenAccent.shade400 : Colors.green;
    final offlineColor = isDark ? theme.colorScheme.error : Colors.red;

    final containerColor = isOnline
        ? (isDark ? Colors.green.withOpacity(0.1) : Colors.green.shade50)
        : (isDark ? theme.colorScheme.surfaceContainerHighest : Colors.grey.shade50);

    final borderColor = isOnline
        ? (isDark ? Colors.green.withOpacity(0.3) : Colors.green.shade200)
        : (isDark ? theme.dividerColor : Colors.grey.shade300);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: containerColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: borderColor),
      ),
      child: Row(
        children: [
          // Status indicator
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            child: Icon(isOnline ? Icons.circle : Icons.circle_outlined, color: isOnline ? onlineColor : offlineColor, size: 16),
          ),
          const SizedBox(width: 8),

          // Status text
          Expanded(
            child: Text(
              isOnline ? 'ONLINE • AVAILABLE' : 'OFFLINE',
              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold, color: isOnline ? onlineColor : offlineColor),
            ),
          ),

          // Toggle button
          SizedBox(
            height: 36,
            child: ElevatedButton(
              onPressed: isLoading ? null : onToggle,
              style: ElevatedButton.styleFrom(
                backgroundColor: isOnline ? offlineColor : onlineColor,
                foregroundColor: theme.colorScheme.onPrimary,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: isLoading
                  ? SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(theme.colorScheme.onPrimary)),
                    )
                  : Text(isOnline ? 'OFFLINE' : 'ONLINE', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
