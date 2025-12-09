import 'package:flutter/material.dart';

import '../../../models/available_order.dart';

class AvailableOrderCard extends StatefulWidget {
  const AvailableOrderCard({required this.order, required this.onAccept, required this.onReject, super.key});

  final AvailableOrder order;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  State<AvailableOrderCard> createState() => _AvailableOrderCardState();
}

class _AvailableOrderCardState extends State<AvailableOrderCard> {
  @override
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final etaMins = (widget.order.distanceFromCourierKm / 25 * 60).ceil();

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: isDark ? 4 : 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header with distance and fare
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, color: theme.colorScheme.primary, size: 20),
                    const SizedBox(width: 4),
                    Text(
                      '${widget.order.distanceFromCourierKm.toStringAsFixed(1)} km away',
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                Text(
                  '💰 ₹${widget.order.pricing.totalPrice.toStringAsFixed(0)}',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: isDark ? theme.colorScheme.secondary : const Color(0xFF2E7D32),
                  ),
                ),
              ],
            ),

            const SizedBox(height: 12),

            // Route information
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(8)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Route:',
                    style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${widget.order.pickup.address} → ${widget.order.delivery.address}',
                    style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Details
            Row(
              children: [
                _buildChip(Icons.two_wheeler, widget.order.vehicleCategory),
                const SizedBox(width: 8),
                _buildChip(Icons.inventory_2, widget.order.packageType),
                const Spacer(),
                Text('⏱️ $etaMins mins away', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6))),
              ],
            ),

            const SizedBox(height: 12),

            // Countdown removed (timer disabled)
            Row(
              children: [
                Icon(Icons.timer_off, size: 16, color: theme.colorScheme.onSurface.withOpacity(0.6)),
                const SizedBox(width: 4),
                Text(
                  'Offer may expire soon',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.6)),
                ),
              ],
            ),

            const SizedBox(height: 16),

            // Action buttons
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: widget.onReject,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: theme.colorScheme.error,
                      side: BorderSide(color: theme.colorScheme.error),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('❌ REJECT'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: widget.onAccept,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isDark ? theme.colorScheme.secondary : const Color(0xFF2E7D32),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    child: const Text('✅ ACCEPT ORDER'),
                  ),
                ),
              ],
            ),

            // View Details button
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () {
                  // TODO: Open order details sheet
                },
                child: const Text('View Details'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChip(IconData icon, String label) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(4)),
      child: Row(
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.onSurface.withOpacity(0.7)),
          const SizedBox(width: 4),
          Text(label, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withOpacity(0.7))),
        ],
      ),
    );
  }
}
