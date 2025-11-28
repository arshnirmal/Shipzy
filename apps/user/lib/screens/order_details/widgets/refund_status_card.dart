// lib/screens/order_details/widgets/refund_status_card.dart

import 'package:flutter/material.dart';

class RefundStatusCard extends StatelessWidget {
  const RefundStatusCard({required this.amount, required this.status, this.refundId, this.processedAt, super.key});

  final double amount;
  final String status;
  final String? refundId;
  final DateTime? processedAt;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.receipt_long, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text('Refund Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 16),
          _RefundRow(label: 'Refund Amount', value: '₹$amount', isBold: true),
          const SizedBox(height: 8),
          _RefundRow(label: 'Status', value: status),
          if (refundId != null) ...[const SizedBox(height: 8), _RefundRow(label: 'Reference ID', value: refundId!)],
          if (processedAt != null) ...[const SizedBox(height: 8), _RefundRow(label: 'Processed On', value: processedAt.toString().split(' ')[0])],
        ],
      ),
    );
  }
}

class _RefundRow extends StatelessWidget {
  const _RefundRow({required this.label, required this.value, this.isBold = false});

  final String label;
  final String value;
  final bool isBold;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
        Text(value, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: isBold ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }
}
