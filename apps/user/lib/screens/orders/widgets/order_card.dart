import 'package:flutter/material.dart';

import '../../../models/orders/order_list_item.dart';
import '../../../models/orders/order_status.dart';
import '../../home/widgets/order_status_badge.dart';

class OrderCard extends StatelessWidget {
  const OrderCard({required this.order, super.key, this.onTap, this.onActionTap});

  final OrderListItem order;
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
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: Icon(Icons.local_shipping_outlined, color: theme.colorScheme.primary, size: 20),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          order.packageDescription ?? 'Package Delivery',
                          style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          order.orderNumber,
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        ),
                      ],
                    ),
                  ),
                  OrderStatusBadge(status: order.status, size: OrderStatusBadgeSize.small),
                ],
              ),
              const SizedBox(height: 20),
              RouteTimeline(pickupAddress: order.pickup.address, deliveryAddress: order.delivery.address),
              const SizedBox(height: 20),
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
                  if (onActionTap != null && (order.status == OrderStatus.inTransit || order.status == OrderStatus.pickedUp)) ...[
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
          ),
        ),
      ),
    );
  }
}

class RouteTimeline extends StatelessWidget {
  const RouteTimeline({required this.pickupAddress, required this.deliveryAddress, super.key});

  final String pickupAddress;
  final String deliveryAddress;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline Line
          Column(
            children: [
              // Pickup Dot
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(color: theme.colorScheme.onSurface, shape: BoxShape.circle),
              ),
              // Dashed Line
              Expanded(
                child: CustomPaint(
                  painter: DashedLinePainter(color: theme.colorScheme.outlineVariant),
                  size: const Size(1, double.infinity),
                ),
              ),
              // Delivery Dot
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  shape: BoxShape.circle,
                  border: Border.all(color: theme.colorScheme.outline, width: 2),
                ),
              ),
            ],
          ),
          const SizedBox(width: 16),
          // Addresses
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Pickup
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('From', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5))),
                    const SizedBox(height: 2),
                    Text(
                      pickupAddress,
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Delivery
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Shipped To', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5))),
                    const SizedBox(height: 2),
                    Text(
                      deliveryAddress,
                      style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.onSurface),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DashedLinePainter extends CustomPainter {
  DashedLinePainter({required this.color, this.dotRadius = 2.0, this.spacing = 4.0});

  final Color color;
  final double dotRadius;
  final double spacing;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeCap = StrokeCap.round
      ..strokeWidth = dotRadius;

    double startY = 4; // Start with a bit of offset
    final endY = size.height - 4; // End with a bit of offset

    while (startY < endY) {
      canvas.drawCircle(Offset(size.width / 2, startY), dotRadius / 2, paint);
      startY += spacing + dotRadius;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
