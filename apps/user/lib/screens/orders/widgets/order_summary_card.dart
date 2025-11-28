// lib/screens/order_details/widgets/order_summary_card.dart

import 'package:flutter/material.dart';

class OrderSummaryCard extends StatelessWidget {
  const OrderSummaryCard({
    required this.vehicleType,
    required this.packageType,
    required this.deliveryType,
    this.distance,
    this.weight,
    this.fare,
    super.key,
  });

  final String vehicleType;
  final String packageType;
  final String deliveryType;
  final String? distance;
  final String? weight;
  final String? fare;

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
          Text('Order Summary', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          _SummaryRow(icon: Icons.local_shipping, label: 'Vehicle', value: vehicleType),
          const Divider(height: 24),

          _SummaryRow(icon: Icons.inventory_2_outlined, label: 'Package', value: packageType, subtitle: weight != null ? 'Weight: $weight' : null),
          if (distance != null) ...[const Divider(height: 24), _SummaryRow(icon: Icons.straighten, label: 'Distance', value: distance!)],
          const Divider(height: 24),

          _SummaryRow(icon: Icons.speed, label: 'Delivery', value: deliveryType),
          if (fare != null) ...[
            const Divider(height: 24),
            _SummaryRow(
              icon: Icons.currency_rupee,
              label: 'Total Fare',
              value: fare!,
              valueStyle: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
            ),
          ],
        ],
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.icon, required this.label, required this.value, this.subtitle, this.valueStyle});

  final IconData icon;
  final String label;
  final String value;
  final String? subtitle;
  final TextStyle? valueStyle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
              if (subtitle != null)
                Text(subtitle!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5))),
            ],
          ),
        ),
        Text(value, style: valueStyle ?? theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}
