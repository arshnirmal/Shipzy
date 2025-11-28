// lib/screens/order_details/widgets/route_details_card.dart

import 'package:flutter/material.dart';

class RouteDetailsCard extends StatelessWidget {
  const RouteDetailsCard({
    required this.pickupAddress,
    required this.deliveryAddress,
    this.pickupContact,
    this.deliveryContact,
    this.isCollapsed = false,
    super.key,
  });

  final String pickupAddress;
  final String deliveryAddress;
  final String? pickupContact;
  final String? deliveryContact;
  final bool isCollapsed;

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
          Text('Route Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),

          // Pickup Address
          _AddressBlock(icon: Icons.circle, iconColor: theme.colorScheme.primary, label: 'PICKUP', address: pickupAddress, contact: pickupContact),

          // Connector
          Container(
            margin: const EdgeInsets.only(left: 11, top: 8, bottom: 8),
            height: 24,
            width: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
              ),
            ),
          ),

          // Delivery Address
          _AddressBlock(
            icon: Icons.location_on,
            iconColor: theme.colorScheme.secondary,
            label: 'DELIVERY',
            address: deliveryAddress,
            contact: deliveryContact,
          ),
        ],
      ),
    );
  }
}

class _AddressBlock extends StatelessWidget {
  const _AddressBlock({required this.icon, required this.iconColor, required this.label, required this.address, this.contact});

  final IconData icon;
  final Color iconColor;
  final String label;
  final String address;
  final String? contact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.1), shape: BoxShape.circle),
          child: Icon(icon, size: 14, color: iconColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
              ),
              const SizedBox(height: 4),
              Text(address, style: theme.textTheme.bodyMedium),
              if (contact != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.phone, size: 14, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                    const SizedBox(width: 4),
                    Text(contact!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),
                  ],
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
