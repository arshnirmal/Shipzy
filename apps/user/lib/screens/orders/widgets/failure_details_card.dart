// lib/screens/order_details/widgets/failure_details_card.dart

import 'package:flutter/material.dart';

class FailureDetailsCard extends StatelessWidget {
  const FailureDetailsCard({required this.reason, this.driverNotes, super.key});

  final String reason;
  final String? driverNotes;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.errorContainer.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.error_outline, color: theme.colorScheme.error),
              const SizedBox(width: 8),
              Text(
                'Delivery Failed',
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.error),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(reason, style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500)),
          if (driverNotes != null) ...[
            const SizedBox(height: 8),
            Text(
              'Driver Note: "$driverNotes"',
              style: theme.textTheme.bodyMedium?.copyWith(fontStyle: FontStyle.italic, color: theme.colorScheme.onSurface.withValues(alpha: 0.8)),
            ),
          ],
        ],
      ),
    );
  }
}
