// lib/screens/order_details/widgets/order_summary_card.dart

import 'package:flutter/material.dart';

import '../../../models/orders/fare_breakdown.dart';
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

          _SummaryRow(icon: Icons.local_shipping, label: 'Vehicle', subtitle: vehicleType),
          const Divider(height: 24),

          _SummaryRow(icon: Icons.inventory_2_outlined, label: 'Package', subtitle: packageType + (weight != null ? ' Weight: $weight' : '')),
          if (distance != null) ...[const Divider(height: 24), _SummaryRow(icon: Icons.straighten, label: 'Distance', subtitle: distance)],
          const Divider(height: 24),

          _SummaryRow(icon: Icons.speed, label: 'Delivery', subtitle: deliveryType),

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

                    _PaymentRow(label: 'Base Fare', value: order!.fareBreakdown.basePrice),
                    if (order!.fareBreakdown.distancePrice > 0) ...[_PaymentRow(label: 'Distance Charge', value: order!.fareBreakdown.distancePrice)],
                    if (order!.fareBreakdown.weightSurcharge > 0) ...[
                      _PaymentRow(label: 'Weight Surcharge', value: order!.fareBreakdown.weightSurcharge),
                    ],
                    if (order!.fareBreakdown.platformFee > 0) ...[_PaymentRow(label: 'Platform Fee', value: order!.fareBreakdown.platformFee)],
                    if (order!.fareBreakdown.gstAmount > 0) ...[_PaymentRow(label: 'GST', value: order!.fareBreakdown.gstAmount)],
                    _PricingRow(
                      label: 'Subtotal (before GST)',
                      value: order!.fareBreakdown.subtotalBeforeTax,
                      isSubtotal: true,
                      valueStyle: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                    ),

                    const Divider(height: 12),
                    _PricingRow(
                      label: 'Total Amount',
                      value: order!.totalPrice,
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
                      subtitle: fare,
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
      return FareBreakdown(
        basePrice: order!.fareBreakdown.basePrice,
        distanceKm: order!.fareBreakdown.distanceKm,
        distancePrice: order!.fareBreakdown.distancePrice,
        weightSurcharge: order!.fareBreakdown.weightSurcharge,
        platformFee: order!.fareBreakdown.platformFee,
        subtotalBeforeTax: order!.fareBreakdown.subtotalBeforeTax,
        gstAmount: order!.fareBreakdown.gstAmount,
        totalPrice: order!.totalPrice,
        currency: order!.fareBreakdown.currency,
      );
    }
    return null; // Fallback if no valid data
  }
}

class _SummaryRow extends StatelessWidget {
  const _SummaryRow({required this.icon, required this.label, this.subtitle, this.valueStyle});

  final IconData icon;
  final String label;
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
        Text(subtitle ?? '', style: valueStyle ?? theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
      ],
    );
  }
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.label, required this.value});

  final String label;
  final double value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
          ),
          Text('₹${value.toStringAsFixed(2)}', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _PricingRow extends StatelessWidget {
  const _PricingRow({required this.label, required this.value, required this.valueStyle, this.isSubtotal = false, this.isTotal = false});

  final String label;
  final double value;
  final TextStyle? valueStyle;
  final bool isSubtotal;
  final bool isTotal;

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
