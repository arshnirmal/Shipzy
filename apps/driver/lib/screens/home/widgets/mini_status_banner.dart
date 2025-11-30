import 'package:flutter/material.dart';

import '../../../models/driver_home_state.dart';

class MiniStatusBanner extends StatelessWidget {
  const MiniStatusBanner({
    required this.status,
    required this.onToggle,
    super.key,
    this.isLoading = false,
  });

  final DriverStatus status;
  final VoidCallback onToggle;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final isOnline = status == DriverStatus.online;
    final theme = Theme.of(context);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isOnline ? Colors.green.shade50 : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isOnline ? Colors.green.shade200 : Colors.grey.shade300,
        ),
      ),
      child: Row(
        children: [
          // Status indicator
          AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            child: Icon(
              isOnline ? Icons.circle : Icons.circle_outlined,
              color: isOnline ? Colors.green : Colors.red,
              size: 16,
            ),
          ),
          const SizedBox(width: 8),

          // Status text
          Expanded(
            child: Text(
              isOnline ? 'ONLINE • AVAILABLE' : 'OFFLINE',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: isOnline ? Colors.green : Colors.red,
              ),
            ),
          ),

          // Toggle button
          SizedBox(
            height: 36,
            child: ElevatedButton(
              onPressed: isLoading ? null : onToggle,
              style: ElevatedButton.styleFrom(
                backgroundColor: isOnline ? Colors.red : Colors.green,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: isLoading
                  ? const SizedBox(
                      height: 16,
                      width: 16,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : Text(
                      isOnline ? 'OFFLINE' : 'ONLINE',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
