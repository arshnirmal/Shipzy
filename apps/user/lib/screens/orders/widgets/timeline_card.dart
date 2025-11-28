// lib/screens/order_details/widgets/timeline_card.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../../models/orders/order_status.dart';

class TimelineCard extends StatelessWidget {
  const TimelineCard({
    required this.status,
    this.orderPlacedAt,
    this.driverAssignedAt,
    this.pickedUpAt,
    this.deliveredAt,
    this.cancelledAt,
    this.failedAt,
    super.key,
  });

  final OrderStatus status;
  final DateTime? orderPlacedAt;
  final DateTime? driverAssignedAt;
  final DateTime? pickedUpAt;
  final DateTime? deliveredAt;
  final DateTime? cancelledAt;
  final DateTime? failedAt;

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
          Text('Order Timeline', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          ..._buildTimelineSteps(theme),
        ],
      ),
    );
  }

  List<Widget> _buildTimelineSteps(ThemeData theme) {
    final steps = <Widget>[];

    // 1. Order Confirmed (Always first)
    steps.add(
      _buildStep(
        title: 'Order Confirmed',
        time: orderPlacedAt != null ? _formatTime(orderPlacedAt!) : null,
        isCompleted: true, // Always completed if we are viewing details
        isCurrent: status == OrderStatus.pending,
      ),
    );

    // If cancelled/rejected immediately
    if ((status == OrderStatus.cancelled || status == OrderStatus.rejected) && driverAssignedAt == null) {
      steps.add(
        _buildStep(
          title: status == OrderStatus.rejected ? 'Order Rejected' : 'Order Cancelled',
          time: cancelledAt != null ? _formatTime(cancelledAt!) : null,
          isCompleted: true,
          isCancelled: true,
          isLast: true,
        ),
      );
      return steps;
    }

    // 2. Driver Assigned
    final isDriverAssigned =
        driverAssignedAt != null || status == OrderStatus.pickedUp || status == OrderStatus.inTransit || status == OrderStatus.delivered;

    steps.add(
      _buildStep(
        title: 'Driver Assigned',
        time: driverAssignedAt != null ? _formatTime(driverAssignedAt!) : null,
        isCompleted: isDriverAssigned,
        isCurrent: status == OrderStatus.accepted,
      ),
    );

    // If cancelled/rejected after driver assigned but before pickup
    if ((status == OrderStatus.cancelled || status == OrderStatus.rejected) && pickedUpAt == null) {
      steps.add(
        _buildStep(
          title: status == OrderStatus.rejected ? 'Order Rejected' : 'Order Cancelled',
          time: cancelledAt != null ? _formatTime(cancelledAt!) : null,
          isCompleted: true,
          isCancelled: true,
          isLast: true,
        ),
      );
      return steps;
    }

    // 3. Package Picked Up
    final isPickedUp = pickedUpAt != null || status == OrderStatus.inTransit || status == OrderStatus.delivered;

    steps.add(
      _buildStep(
        title: 'Package Picked Up',
        time: pickedUpAt != null ? _formatTime(pickedUpAt!) : null,
        isCompleted: isPickedUp,
        isCurrent: status == OrderStatus.pickedUp,
      ),
    );

    // If cancelled/rejected after pickup (rare but possible)
    if ((status == OrderStatus.cancelled || status == OrderStatus.rejected) && deliveredAt == null) {
      steps.add(
        _buildStep(
          title: status == OrderStatus.rejected ? 'Order Rejected' : 'Order Cancelled',
          time: cancelledAt != null ? _formatTime(cancelledAt!) : null,
          isCompleted: true,
          isCancelled: true,
          isLast: true,
        ),
      );
      return steps;
    }

    // 4. Delivered
    final isDelivered = deliveredAt != null || status == OrderStatus.delivered;

    steps.add(_buildStep(title: 'Delivered', time: deliveredAt != null ? _formatTime(deliveredAt!) : null, isCompleted: isDelivered, isLast: true));

    return steps;
  }

  Widget _buildStep({
    required String title,
    String? time,
    bool isCompleted = false,
    bool isCurrent = false,
    bool isCancelled = false,
    bool isLast = false,
  }) => _TimelineStep(title: title, time: time, isCompleted: isCompleted, isCurrent: isCurrent, isCancelled: isCancelled, isLast: isLast);

  String _formatTime(DateTime dateTime) => DateFormat('h:mm a').format(dateTime);
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    this.time,
    this.isCompleted = false,
    this.isCurrent = false,
    this.isCancelled = false,
    this.isLast = false,
  });

  final String title;
  final String? time;
  final bool isCompleted;
  final bool isCurrent;
  final bool isCancelled;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final Color indicatorColor;
    final IconData icon;

    if (isCancelled) {
      indicatorColor = Colors.orange;
      icon = Icons.cancel;
    } else if (isCompleted) {
      indicatorColor = Colors.green;
      icon = Icons.check_circle;
    } else if (isCurrent) {
      indicatorColor = theme.colorScheme.primary;
      icon = Icons.radio_button_checked;
    } else {
      indicatorColor = theme.colorScheme.outlineVariant;
      icon = Icons.radio_button_unchecked;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: isCompleted || isCurrent ? indicatorColor : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(color: indicatorColor, width: 2),
                ),
                child: Icon(icon, size: 12, color: isCompleted || isCurrent ? Colors.white : indicatorColor),
              ),
              if (!isLast)
                Expanded(
                  child: Container(width: 2, margin: const EdgeInsets.symmetric(vertical: 4), color: theme.colorScheme.outlineVariant),
                ),
            ],
          ),
          const SizedBox(width: 12),

          // Content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    title,
                    style: theme.textTheme.bodyMedium?.copyWith(
                      fontWeight: isCompleted || isCurrent ? FontWeight.w600 : FontWeight.normal,
                      color: isCompleted || isCurrent ? theme.colorScheme.onSurface : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                    ),
                  ),
                  if (time != null)
                    Text(time!, style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6))),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
