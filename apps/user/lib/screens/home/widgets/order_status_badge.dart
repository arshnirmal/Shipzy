// lib/widgets/home/order_status_badge.dart

import 'package:flutter/material.dart';

import '../../../models/orders/order_status.dart';

class OrderStatusBadge extends StatelessWidget {
  const OrderStatusBadge({required this.status, this.size = OrderStatusBadgeSize.medium, super.key});

  final OrderStatus status;
  final OrderStatusBadgeSize size;

  @override
  Widget build(BuildContext context) {
    final colors = _getStatusColors(context);
    final fontSize = size == OrderStatusBadgeSize.small ? 11.0 : 12.0;
    final padding = size == OrderStatusBadgeSize.small
        ? const EdgeInsets.symmetric(horizontal: 8, vertical: 4)
        : const EdgeInsets.symmetric(horizontal: 10, vertical: 6);

    return Container(
      padding: padding,
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: colors.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 6,
            height: 6,
            decoration: BoxDecoration(color: colors.dot, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            status.name,
            style: TextStyle(color: colors.text, fontSize: fontSize, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }

  _StatusColors _getStatusColors(BuildContext context) {
    final theme = Theme.of(context);

    switch (status) {
      case OrderStatus.pending:
        return _StatusColors(
          background: theme.colorScheme.tertiary.withValues(alpha: 0.1),
          border: theme.colorScheme.tertiary.withValues(alpha: 0.3),
          dot: theme.colorScheme.tertiary,
          text: theme.colorScheme.tertiary,
        );

      case OrderStatus.accepted:
        return _StatusColors(
          background: theme.colorScheme.primary.withValues(alpha: 0.1),
          border: theme.colorScheme.primary.withValues(alpha: 0.3),
          dot: theme.colorScheme.primary,
          text: theme.colorScheme.primary,
        );

      case OrderStatus.pickedUp:
        // ✅ FIXED: Now uses theme's tertiary color (orange) instead of hardcoded
        return _StatusColors(
          background: theme.colorScheme.tertiary.withValues(alpha: 0.15),
          border: theme.colorScheme.tertiary.withValues(alpha: 0.4),
          dot: theme.colorScheme.tertiary,
          text: theme.colorScheme.tertiary,
        );

      case OrderStatus.inTransit:
        return _StatusColors(
          background: theme.colorScheme.secondary.withValues(alpha: 0.1),
          border: theme.colorScheme.secondary.withValues(alpha: 0.3),
          dot: theme.colorScheme.secondary,
          text: theme.colorScheme.secondary,
        );

      case OrderStatus.delivered:
        return _StatusColors(
          background: theme.colorScheme.secondary.withValues(alpha: 0.1),
          border: theme.colorScheme.secondary.withValues(alpha: 0.3),
          dot: theme.colorScheme.secondary,
          text: theme.colorScheme.secondary,
        );

      case OrderStatus.cancelled:
        return _StatusColors(
          background: theme.colorScheme.error.withValues(alpha: 0.1),
          border: theme.colorScheme.error.withValues(alpha: 0.3),
          dot: theme.colorScheme.error,
          text: theme.colorScheme.error,
        );

      case OrderStatus.rejected:
        return _StatusColors(
          background: theme.colorScheme.error.withValues(alpha: 0.1),
          border: theme.colorScheme.error.withValues(alpha: 0.3),
          dot: theme.colorScheme.error,
          text: theme.colorScheme.error,
        );
    }
  }
}

class _StatusColors {
  const _StatusColors({required this.background, required this.border, required this.dot, required this.text});

  final Color background;
  final Color border;
  final Color dot;
  final Color text;
}

enum OrderStatusBadgeSize { small, medium }
