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
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icons and Line
                Column(
                  children: [
                    _buildIcon(theme, Icons.circle, theme.colorScheme.primary),
                    Expanded(
                      child: Container(
                        width: 2,
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [theme.colorScheme.primary, theme.colorScheme.secondary],
                          ),
                        ),
                      ),
                    ),
                    _buildIcon(theme, Icons.location_on, theme.colorScheme.secondary),
                  ],
                ),
                const SizedBox(width: 12),
                // Address Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _AddressContent(label: 'PICKUP', address: pickupAddress, contact: pickupContact),
                      const SizedBox(height: 24), // Spacing between pickup and delivery
                      _AddressContent(label: 'DELIVERY', address: deliveryAddress, contact: deliveryContact),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIcon(ThemeData theme, IconData icon, Color color) => Container(
    width: 24,
    height: 24,
    decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
    child: Icon(icon, size: 14, color: color),
  );
}

class _AddressContent extends StatelessWidget {
  const _AddressContent({required this.label, required this.address, this.contact});

  final String label;
  final String address;
  final String? contact;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
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
              Icon(Icons.phone, size: 16, color: theme.colorScheme.primary),
              const SizedBox(width: 8),
              Text(contact!, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
            ],
          ),
        ],
      ],
    );
  }
}
