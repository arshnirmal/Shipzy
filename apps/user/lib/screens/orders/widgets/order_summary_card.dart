// lib/screens/order_details/widgets/order_summary_card.dart

import 'package:flutter/material.dart';

import '../../../models/orders/create_order.dart';
import '../../../models/orders/order.dart';

class OrderSummaryCard extends StatelessWidget {
  const OrderSummaryCard({
    required this.vehicleType,
    required this.packageType,
    required this.deliveryType,
    this.distance,
    this.weight,
    this.order,
    this.fare,
    super.key,
  });

  final String vehicleType;
  final String packageType;
  final String deliveryType;
  final String? distance;
  final String? weight;
  final Order? order;
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

          // Enhanced pricing breakdown or simple fare
          Builder(
            builder: (context) {
              final breakdown = _getFareBreakdown();
              if (breakdown != null) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Divider(height: 24),
                    Text('Fare Breakdown', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),

                    _PricingRow(label: 'Base Fare', value: breakdown.basePrice),
                    _PricingRow(label: 'Distance (${breakdown.distanceKm} km)', value: breakdown.distancePrice),
                    if (breakdown.weightSurcharge > 0) _PricingRow(label: 'Weight Surcharge', value: breakdown.weightSurcharge),
                    if (breakdown.specialHandlingFee > 0) _PricingRow(label: 'Special Handling', value: breakdown.specialHandlingFee),

                    const Divider(height: 12),
                    _PricingRow(label: 'Subtotal (before GST)', value: breakdown.subtotalBeforeTax, isSubtotal: true),

                    _PricingRow(label: 'Platform Fee', value: breakdown.platformFee),
                    _PricingRow(label: 'GST (${(breakdown.gstAmount / breakdown.subtotalBeforeTax * 100).round()}%)', value: breakdown.gstAmount),

                    const Divider(height: 12),
                    _PricingRow(
                      label: 'Total Amount',
                      value: breakdown.totalPrice,
                      isTotal: true,
                      valueStyle: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                    ),
                  ],
                );
              } else if (fare != null) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Divider(height: 24),
                    _SummaryRow(
                      icon: Icons.currency_rupee,
                      label: 'Total Fare',
                      value: fare!,
                      valueStyle: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                    ),
                  ],
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
    );
  }

  FareBreakdown? _getFareBreakdown() {
    // Try to create FareBreakdown from Order first
    if (order != null) {
      final dist = order!.actualDistanceKm ?? order!.estimatedDistanceKm;
      if (order!.basePrice != null &&
          order!.distancePrice != null &&
          order!.weightSurcharge != null &&
          order!.platformFee != null &&
          order!.specialHandlingFee != null &&
          order!.gstAmount != null &&
          order!.subtotalBeforeTax != null &&
          dist != null) {
        return FareBreakdown(
          basePrice: order!.basePrice!,
          distanceKm: dist,
          distancePrice: order!.distancePrice!,
          weightSurcharge: order!.weightSurcharge!,
          platformFee: order!.platformFee!,
          specialHandlingFee: order!.specialHandlingFee!,
          subtotalBeforeTax: order!.subtotalBeforeTax!,
          gstAmount: order!.gstAmount!,
          totalPrice: order!.totalPrice,
          currency: order!.currency ?? 'INR',
        );
      }
    }
    return null; // Fallback if no valid data
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

class _PricingRow extends StatelessWidget {
  const _PricingRow({required this.label, required this.value, this.isSubtotal = false, this.isTotal = false, this.valueStyle});

  final String label;
  final double value;
  final bool isSubtotal;
  final bool isTotal;
  final TextStyle? valueStyle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              label,
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withValues(alpha: isTotal ? 0.9 : 0.7),
                fontWeight: isSubtotal || isTotal ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
          ),
          Text(
            '₹${value.toStringAsFixed(2)}',
            style: valueStyle ?? theme.textTheme.bodyMedium?.copyWith(fontWeight: isSubtotal || isTotal ? FontWeight.w600 : FontWeight.normal),
          ),
        ],
      ),
    );
  }
}
