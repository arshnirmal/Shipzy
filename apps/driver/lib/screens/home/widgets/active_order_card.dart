import 'package:flutter/material.dart';

import '../../../models/active_order.dart';

class ActiveOrderCard extends StatelessWidget {
  const ActiveOrderCard({
    required this.order,
    required this.onNavigate,
    required this.onCall,
    super.key,
  });

  final ActiveOrder order;
  final VoidCallback onNavigate;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) => Card(
    elevation: 4,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          colors: [Colors.blue.shade50, Colors.white],
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
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.local_shipping, color: Colors.blue, size: 24),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '🚚 IN TRANSIT • ${order.orderNumber}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 16),
                  Text(
                    '📍 Delivering to: ${order.delivery['address']}',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.timer, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('⏱️ ETA: ${order.estimatedDeliveryTime} mins'),
                      const SizedBox(width: 16),
                      const Icon(Icons.attach_money, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text('💰 Earning: ₹${order.driverEarnings.toStringAsFixed(0)}'),
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
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Order Progress Timeline
            const Text(
              'Order Progress',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            _buildTimeline(),

            const SizedBox(height: 20),

            // Customer Details
            const Text(
              'Customer Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text('👤 ', style: TextStyle(fontSize: 16)),
                      Expanded(
                        child: Text(
                          order.delivery['contactName'] ?? 'Customer',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.phone, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        order.delivery['contactPhone'] ?? '',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      const Spacer(),
                      IconButton(
                        onPressed: onCall,
                        icon: const Icon(Icons.call),
                        color: Colors.green,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.green.shade50,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        onPressed: () {
                          // TODO: Send message
                        },
                        icon: const Icon(Icons.message),
                        color: Colors.blue,
                        style: IconButton.styleFrom(
                          backgroundColor: Colors.blue.shade50,
                        ),
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
                          '${order.delivery['address']}\n${order.delivery['building'] ?? ''} ${order.delivery['landmark'] ?? ''}',
                          style: const TextStyle(fontSize: 14, color: Colors.grey),
                        ),
                      ),
                    ],
                  ),
                  if (order.specialInstructions != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.yellow.shade50,
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.yellow.shade200),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('ℹ️ ', style: TextStyle(fontSize: 14)),
                          Expanded(
                            child: Text(
                              order.specialInstructions!,
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
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
            const Text(
              'Package Details',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Text('📦 ', style: TextStyle(fontSize: 16)),
                      Expanded(
                        child: Text(
                          '${order.packageType} • ${order.packageDescription}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
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
                        style: const TextStyle(color: Colors.grey),
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
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Actions
            const Text(
              'Actions',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
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
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
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
                      foregroundColor: Colors.orange,
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

  Widget _buildTimeline() {
    final steps = [
      {
        'title': 'Order Accepted',
        'time': order.acceptedAt,
        'icon': Icons.check_circle,
        'color': Colors.green,
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
      {
        'title': 'In Transit',
        'time': 'Now',
        'icon': Icons.radio_button_checked,
        'color': Colors.blue,
        'isCompleted': false,
      },
      {
        'title': 'Delivery Pending',
        'time': '',
        'icon': Icons.radio_button_unchecked,
        'color': Colors.grey,
        'isCompleted': false,
      },
    ];

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: steps.map((step) {
          final isLast = steps.last == step;
          return Column(
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    step['icon'] as IconData,
                    color: step['color'] as Color,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          step['title'] as String,
                          style: TextStyle(
                            fontWeight: FontWeight.w500,
                            color: step['isCompleted'] as bool ? Colors.black : Colors.grey,
                          ),
                        ),
                        if (step['time'] != '')
                          Text(
                            step['time'] as String,
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              if (!isLast) ...[
                const SizedBox(height: 8),
                Container(
                  margin: const EdgeInsets.only(left: 9),
                  width: 2,
                  height: 20,
                  color: Colors.grey.shade300,
                ),
                const SizedBox(height: 8),
              ],
            ],
          );
        }).toList(),
      ),
    );
  }
}
