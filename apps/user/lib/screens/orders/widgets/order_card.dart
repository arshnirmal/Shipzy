import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/orders/order.dart';
import '../../../models/orders/order_status.dart';
import '../../home/widgets/order_status_badge.dart';

class OrderCard extends StatelessWidget {
  const OrderCard({required this.order, super.key, this.onTap, this.onActionTap});

  final Order order;
  final VoidCallback? onTap;
  final VoidCallback? onActionTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.2)),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header: Status and Order Number
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  OrderStatusBadge(status: order.status),
                  Text(
                    order.orderNumber,
                    style: theme.textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w500,
                      color: theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Route
              _buildRouteRow(
                context,
                icon: Icons.trip_origin,
                iconColor: theme.colorScheme.primary,
                label: 'From',
                text: _shortenAddress(order.pickupAddress),
              ),
              const SizedBox(height: 8),
              _buildRouteRow(
                context,
                icon: Icons.location_on,
                iconColor: theme.colorScheme.error,
                label: 'To',
                text: _shortenAddress(order.deliveryAddress),
              ),

              const SizedBox(height: 16),
              const Divider(height: 1),
              const SizedBox(height: 12),

              // Metadata Row
              Row(
                children: [
                  Expanded(
                    child: _buildMetadataItem(context, icon: Icons.local_shipping_outlined, text: order.deliveryTypeDisplay ?? order.packageType),
                  ),
                  Expanded(
                    child: _buildMetadataItem(context, icon: Icons.access_time, text: _formatDate(order.createdAt)),
                  ),
                  Text(
                    '₹${order.totalFare.toStringAsFixed(0)}',
                    style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                  ),
                ],
              ),

              // Actions (if active)
              if (order.status.isActive) ...[
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: onTap,
                        icon: const Icon(Icons.visibility_outlined, size: 18),
                        label: const Text('Details'),
                        style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                      ),
                    ),
                    if (order.status == OrderStatus.inTransit || order.status == OrderStatus.pickedUp) ...[
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: onActionTap,
                          icon: const Icon(Icons.my_location, size: 18),
                          label: const Text('Track Live'),
                          style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 10)),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRouteRow(BuildContext context, {required IconData icon, required Color iconColor, required String label, required String text}) {
    final theme = Theme.of(context);
    return Row(
      children: [
        Icon(icon, size: 16, color: iconColor.withValues(alpha: 0.7)),
        const SizedBox(width: 8),
        Text(
          '$label:',
          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6), fontWeight: FontWeight.w500),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
        ),
      ],
    );
  }

  Widget _buildMetadataItem(BuildContext context, {required IconData icon, required String text}) {
    final theme = Theme.of(context);
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
        const SizedBox(width: 4),
        Flexible(
          child: Text(text, style: theme.textTheme.bodySmall, maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }

  String _shortenAddress(String address) {
    final parts = address.split(',');
    if (parts.length >= 2) {
      return '${parts[0]}, ${parts[1]}';
    }
    return address.length > 35 ? '${address.substring(0, 35)}...' : address;
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      return 'Today, ${DateFormat.jm().format(date)}';
    }
    return DateFormat('d MMM, jm').format(date);
  }
}
