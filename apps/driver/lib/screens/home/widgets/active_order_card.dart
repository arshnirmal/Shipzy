import 'package:flutter/material.dart';

import '../../../models/active_order.dart';

class ActiveOrderCard extends StatelessWidget {
  const ActiveOrderCard({required this.order, required this.onNavigate, required this.onCall, this.onMarkPickedUp, this.onMarkDelivered, super.key});

  final ActiveOrder order;
  final VoidCallback onNavigate;
  final VoidCallback onCall;
  final VoidCallback? onMarkPickedUp;
  final VoidCallback? onMarkDelivered;

  @override
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Card(
      elevation: isDark ? 4 : 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: isDark
                ? [theme.colorScheme.surfaceContainerHighest, theme.cardColor]
                : [theme.colorScheme.primaryContainer.withValues(alpha: 0.3), theme.cardColor],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Order header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: isDark ? theme.dividerColor : theme.colorScheme.primary.withValues(alpha: 0.2)),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_shipping, color: theme.colorScheme.primary, size: 24),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            '🚚 IN TRANSIT • ${order.orderNumber}',
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold, color: theme.colorScheme.primary),
                          ),
                        ),
                      ],
                    ),
                    Divider(height: 16, color: theme.dividerColor),
                    Text(
                      '📍 Delivering to: ${order.delivery.address}',
                      style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.timer, size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        const SizedBox(width: 4),
                        Text('⏱️ ETA: ${order.estimatedDeliveryTime} mins', style: theme.textTheme.bodyMedium),
                        const SizedBox(width: 16),
                        Icon(Icons.attach_money, size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        const SizedBox(width: 4),
                        Text('💰 Earning: ₹${order.driverEarnings.toStringAsFixed(0)}', style: theme.textTheme.bodyMedium),
                      ],
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: onNavigate,
                        icon: const Icon(Icons.navigation),
                        label: const Text('🗺️ NAVIGATE TO DESTINATION'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: theme.colorScheme.primary,
                          foregroundColor: theme.colorScheme.onPrimary,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Order Progress Timeline
              Text('Order Progress', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              _buildTimeline(context),

              const SizedBox(height: 20),

              // Customer Details
              Text('Customer Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: theme.dividerColor),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Text('👤 ', style: TextStyle(fontSize: 16)),
                        Expanded(
                          child: Text(
                            order.delivery.contactName ?? 'Customer',
                            style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(Icons.phone, size: 16, color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        const SizedBox(width: 4),
                        Text(
                          order.delivery.contactPhone ?? '',
                          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        ),
                        const Spacer(),
                        IconButton(
                          onPressed: onCall,
                          icon: const Icon(Icons.call),
                          color: Colors.green, // Keep semantic color
                          style: IconButton.styleFrom(backgroundColor: Colors.green.withValues(alpha: 0.1)),
                        ),
                        const SizedBox(width: 8),
                        IconButton(
                          onPressed: () {
                            // TODO: Send message
                          },
                          icon: const Icon(Icons.message),
                          color: theme.colorScheme.primary,
                          style: IconButton.styleFrom(backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.1)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('📍 ', style: TextStyle(fontSize: 14)),
                        Expanded(
                          child: Text(
                            '${order.delivery.address}\n${order.delivery.building ?? ''} ${order.delivery.landmark ?? ''}',
                            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                          ),
                        ),
                      ],
                    ),
                    if (order.specialInstructions != null) ...[
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.yellow.withValues(alpha: isDark ? 0.1 : 0.1), // Semantic warning color
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: Colors.yellow.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('ℹ️ ', style: TextStyle(fontSize: 14)),
                            Expanded(
                              child: Text(
                                order.specialInstructions!,
                                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.8)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Package Details
              Text('Package Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.cardColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: theme.dividerColor),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Text('📦 ', style: TextStyle(fontSize: 16)),
                        Expanded(
                          child: Text(
                            '${order.packageType} • ${order.packageDescription}',
                            style: theme.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Text('🚚 ', style: TextStyle(fontSize: 16)),
                        Text(
                          'Vehicle: ${order.vehicleCategoryDisplay}',
                          style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        ),
                      ],
                    ),
                    if (order.specialInstructions != null) ...[
                      const SizedBox(height: 8),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('⚠️ ', style: TextStyle(fontSize: 14)),
                          Expanded(
                            child: Text(
                              order.specialInstructions!,
                              style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Status Update Actions
              if (onMarkPickedUp != null || onMarkDelivered != null) ...[
                Text('Order Status', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                if (onMarkPickedUp != null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onMarkPickedUp,
                      icon: const Icon(Icons.inventory_2),
                      label: const Text('📦 MARK AS PICKED UP'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                if (onMarkPickedUp != null && onMarkDelivered != null) const SizedBox(height: 8),
                if (onMarkDelivered != null)
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: onMarkDelivered,
                      icon: const Icon(Icons.check_circle),
                      label: const Text('✅ MARK AS DELIVERED'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                const SizedBox(height: 20),
              ],

              // Additional Actions
              Text('Actions', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // TODO: Report issue
                      },
                      icon: const Icon(Icons.report_problem),
                      label: const Text('🆘 Report Issue'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: theme.colorScheme.error,
                        side: BorderSide(color: theme.colorScheme.error),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        // TODO: Take break
                      },
                      icon: const Icon(Icons.pause),
                      label: const Text('⏸️ Take Break'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange, // Semantic warning
                        side: const BorderSide(color: Colors.orange),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTimeline(BuildContext context) {
    final theme = Theme.of(context);

    final steps = [
      {
        'title': 'Order Accepted',
        'time': order.acceptedAt,
        'icon': Icons.check_circle,
        'color': Colors.green, // Semantic success
        'isCompleted': true,
      },
      {
        'title': 'Reached Pickup',
        'time': '2:45 PM', // TODO: Use actual timestamps
        'icon': Icons.check_circle,
        'color': Colors.green,
        'isCompleted': true,
      },
      {
        'title': 'Package Picked Up',
        'time': '2:48 PM', // TODO: Use actual timestamps
        'icon': Icons.check_circle,
        'color': Colors.green,
        'isCompleted': true,
      },
      {'title': 'In Transit', 'time': 'Now', 'icon': Icons.radio_button_checked, 'color': theme.colorScheme.primary, 'isCompleted': false},
      {'title': 'Delivery Pending', 'time': '', 'icon': Icons.radio_button_unchecked, 'color': theme.disabledColor, 'isCompleted': false},
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.dividerColor),
      ),
      child: Column(
        children: steps.map((step) {
          final isLast = steps.last == step;
          final isCompleted = step['isCompleted'] as bool;

          return Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(step['icon'] as IconData, color: step['color'] as Color, size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['title'] as String,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.w500,
                            color: isCompleted || step['title'] == 'In Transit'
                                ? theme.colorScheme.onSurface
                                : theme.colorScheme.onSurface.withValues(alpha: 0.5),
                          ),
                        ),
                        if (step['time'] != '')
                          Text(
                            step['time'] as String,
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.5)),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              if (!isLast) ...[
                const SizedBox(height: 8),
                Container(margin: const EdgeInsets.only(left: 9), width: 2, height: 20, color: theme.dividerColor),
                const SizedBox(height: 8),
              ],
            ],
          );
        }).toList(),
      ),
    );
  }
}
