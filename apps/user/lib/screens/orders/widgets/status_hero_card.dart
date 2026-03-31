// lib/screens/order_details/widgets/status_hero_card.dart

import 'package:flutter/material.dart';

import '../../../models/orders/order_status.dart';

class StatusHeroCard extends StatelessWidget {
  const StatusHeroCard({
    required this.status,
    required this.orderNumber,
    this.timestamp,
    this.etaText,
    this.distanceText,
    this.reasonText,
    this.onPrimaryAction,
    this.onSecondaryAction,
    this.primaryActionLabel,
    this.secondaryActionLabel,
    this.primaryActionIcon,
    this.secondaryActionIcon,
    super.key,
  });

  final OrderStatus status;
  final String orderNumber;
  final DateTime? timestamp;
  final String? etaText;
  final String? distanceText;
  final String? reasonText;
  final VoidCallback? onPrimaryAction;
  final VoidCallback? onSecondaryAction;
  final String? primaryActionLabel;
  final String? secondaryActionLabel;
  final IconData? primaryActionIcon;
  final IconData? secondaryActionIcon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusConfig = _getStatusConfig(theme);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: statusConfig.backgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusConfig.borderColor, width: 2),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Title
          Row(
            children: [
              Icon(statusConfig.icon, color: statusConfig.iconColor, size: 24),
              const SizedBox(width: 8),
              Text(
                statusConfig.title,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: statusConfig.textColor),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Order Number
          Text('#$orderNumber', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7))),

          // Divider
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            height: 1,
            decoration: BoxDecoration(gradient: LinearGradient(colors: [statusConfig.borderColor, statusConfig.borderColor.withValues(alpha: 0)])),
          ),

          // Status-specific content
          ..._buildStatusContent(theme),

          // Action Buttons
          if (onPrimaryAction != null || onSecondaryAction != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                if (onPrimaryAction != null)
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: onPrimaryAction,
                      icon: Icon(primaryActionIcon ?? Icons.touch_app, size: 18),
                      label: Text(primaryActionLabel ?? 'Action'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: statusConfig.buttonColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                if (onPrimaryAction != null && onSecondaryAction != null) const SizedBox(width: 12),
                if (onSecondaryAction != null)
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: onSecondaryAction,
                      icon: Icon(secondaryActionIcon ?? Icons.touch_app, size: 18),
                      label: Text(secondaryActionLabel ?? 'Action'),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 12)),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  List<Widget> _buildStatusContent(ThemeData theme) {
    final widgets = <Widget>[];

    if (etaText != null) {
      widgets.add(_buildInfoRow(theme, Icons.access_time, etaText!));
      widgets.add(const SizedBox(height: 8));
    }

    if (distanceText != null) {
      widgets.add(_buildInfoRow(theme, Icons.location_on, distanceText!));
      widgets.add(const SizedBox(height: 8));
    }

    if (reasonText != null) {
      widgets.add(_buildInfoRow(theme, Icons.info_outline, reasonText!));
    }

    return widgets;
  }

  Widget _buildInfoRow(ThemeData theme, IconData icon, String text) => Row(
    children: [
      Icon(icon, size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
      const SizedBox(width: 8),
      Expanded(
        child: Text(text, style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.8))),
      ),
    ],
  );

  _StatusConfig _getStatusConfig(ThemeData theme) {
    switch (status) {
      case OrderStatus.pending:
        return _StatusConfig(
          title: 'FINDING DRIVER...',
          icon: Icons.hourglass_empty,
          iconColor: Colors.amber,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: Colors.amber.withValues(alpha: 0.1),
          borderColor: Colors.amber.withValues(alpha: 0.3),
          buttonColor: Colors.amber,
        );

      case OrderStatus.accepted:
        return _StatusConfig(
          title: 'DRIVER ON THE WAY',
          icon: Icons.directions_car,
          iconColor: Colors.blue,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: Colors.blue.withValues(alpha: 0.1),
          borderColor: Colors.blue.withValues(alpha: 0.3),
          buttonColor: Colors.blue,
        );

      case OrderStatus.pickedUp:
      case OrderStatus.inTransit:
        return _StatusConfig(
          title: 'IN TRANSIT',
          icon: Icons.local_shipping,
          iconColor: theme.colorScheme.secondary,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: theme.colorScheme.secondary.withValues(alpha: 0.1),
          borderColor: theme.colorScheme.secondary.withValues(alpha: 0.3),
          buttonColor: theme.colorScheme.secondary,
        );

      case OrderStatus.delivered:
        return _StatusConfig(
          title: 'DELIVERED SUCCESSFULLY',
          icon: Icons.check_circle,
          iconColor: Colors.green,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: Colors.green.withValues(alpha: 0.1),
          borderColor: Colors.green.withValues(alpha: 0.3),
          buttonColor: Colors.green,
        );

      case OrderStatus.cancelled:
      case OrderStatus.returned:
        return _StatusConfig(
          title: 'ORDER CANCELLED',
          icon: Icons.cancel,
          iconColor: Colors.orange,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: Colors.orange.withValues(alpha: 0.1),
          borderColor: Colors.orange.withValues(alpha: 0.3),
          buttonColor: Colors.orange,
        );

      case OrderStatus.undeliverable:
      case OrderStatus.rejected:
        return _StatusConfig(
          title: 'DELIVERY FAILED',
          icon: Icons.error,
          iconColor: theme.colorScheme.error,
          textColor: theme.colorScheme.onSurface,
          backgroundColor: theme.colorScheme.error.withValues(alpha: 0.1),
          borderColor: theme.colorScheme.error.withValues(alpha: 0.3),
          buttonColor: theme.colorScheme.error,
        );
    }
  }
}

class _StatusConfig {
  _StatusConfig({
    required this.title,
    required this.icon,
    required this.iconColor,
    required this.textColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.buttonColor,
  });
  final String title;
  final IconData icon;
  final Color iconColor;
  final Color textColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color buttonColor;
}
