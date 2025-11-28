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

    // Order Placed
    if (orderPlacedAt != null) {
      steps.add(
        _TimelineStep(
          title: 'Order Confirmed',
          time: _formatTime(orderPlacedAt!),
          isCompleted: true,
          isLast: status == OrderStatus.pending && cancelledAt == null,
        ),
      );
    }

    // Cancelled early
    if (cancelledAt != null && driverAssignedAt == null) {
      steps.add(_TimelineStep(title: 'Cancelled', time: _formatTime(cancelledAt!), isCompleted: true, isCancelled: true, isLast: true));
      return steps;
    }

    // Driver Assigned
    if (driverAssignedAt != null) {
      steps.add(
        _TimelineStep(
          title: 'Driver Assigned',
          time: _formatTime(driverAssignedAt!),
          isCompleted: true,
          isLast: status == OrderStatus.accepted && cancelledAt == null && failedAt == null,
        ),
      );
    } else if (status != OrderStatus.pending) {
      steps.add(const _TimelineStep(title: 'Driver Assigned', isLast: true));
      return steps;
    }

    // Cancelled after driver assigned
    if (cancelledAt != null && pickedUpAt == null) {
      steps.add(_TimelineStep(title: 'Cancelled', time: _formatTime(cancelledAt!), isCompleted: true, isCancelled: true, isLast: true));
      return steps;
    }

    // Package Picked Up
    if (pickedUpAt != null) {
      steps.add(
        _TimelineStep(
          title: 'Package Picked Up',
          time: _formatTime(pickedUpAt!),
          isCompleted: true,
          isLast: status == OrderStatus.pickedUp && cancelledAt == null && failedAt == null,
        ),
      );
    } else if (status == OrderStatus.accepted || status == OrderStatus.pickedUp) {
      steps.add(const _TimelineStep(title: 'Pickup pending', isLast: true));
      return steps;
    }

    // In Transit
    if (status == OrderStatus.pickedUp || deliveredAt != null || failedAt != null) {
      final isInTransit = status == OrderStatus.pickedUp;
      steps.add(
        _TimelineStep(
          title: isInTransit ? 'In Transit' : 'In Transit',
          time: isInTransit ? 'Now' : null,
          isCompleted: deliveredAt != null || failedAt != null,
          isCurrent: isInTransit,
          isLast: isInTransit && failedAt == null && deliveredAt == null,
        ),
      );
    }

    // Failed
    if (failedAt != null) {
      steps.add(_TimelineStep(title: 'Delivery Failed', time: _formatTime(failedAt!), isCompleted: true, isFailed: true, isLast: true));
      return steps;
    }

    // Delivered
    if (deliveredAt != null) {
      steps.add(_TimelineStep(title: 'Delivered', time: _formatTime(deliveredAt!), isCompleted: true, isLast: true));
    } else if (status != OrderStatus.delivered) {
      steps.add(const _TimelineStep(title: 'Delivery pending', isLast: true));
    }

    return steps;
  }

  String _formatTime(DateTime dateTime) => DateFormat('h:mm a').format(dateTime);
}

class _TimelineStep extends StatelessWidget {
  const _TimelineStep({
    required this.title,
    this.time,
    this.isCompleted = false,
    this.isCurrent = false,
    this.isCancelled = false,
    this.isFailed = false,
    this.isLast = false,
  });

  final String title;
  final String? time;
  final bool isCompleted;
  final bool isCurrent;
  final bool isCancelled;
  final bool isFailed;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final Color indicatorColor;
    final IconData icon;

    if (isCancelled) {
      indicatorColor = Colors.orange;
      icon = Icons.cancel;
    } else if (isFailed) {
      indicatorColor = theme.colorScheme.error;
      icon = Icons.error;
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
                width: 24,
                height: 24,
                decoration: BoxDecoration(
                  color: isCompleted || isCurrent ? indicatorColor : Colors.transparent,
                  shape: BoxShape.circle,
                  border: Border.all(color: indicatorColor, width: 2),
                ),
                child: Icon(icon, size: 14, color: isCompleted || isCurrent ? Colors.white : indicatorColor),
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
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
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
