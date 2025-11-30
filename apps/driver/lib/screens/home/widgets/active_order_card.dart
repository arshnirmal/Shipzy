import 'package:flutter/material.dart';

import '../../../models/active_order.dart';

class ActiveOrderCard extends StatelessWidget {
  const ActiveOrderCard({required this.order, required this.onNavigate, required this.onCall, super.key});
  final ActiveOrder order;
  final VoidCallback onNavigate;
  final VoidCallback onCall;

  @override
  Widget build(BuildContext context) => Card(
    elevation: 4,
    color: Colors.blue.shade50,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.local_shipping, color: Colors.blue),
              const SizedBox(width: 8),
              Text(
                'IN TRANSIT • ${order.orderNumber}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blue),
              ),
            ],
          ),
          const Divider(height: 24),
          Text(
            'Delivering to ${order.deliveryAddress}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.timer, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text('ETA: ${order.etaMinutes} mins'),
              const SizedBox(width: 16),
              const Icon(Icons.attach_money, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text('₹${order.fare.toStringAsFixed(0)}'),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(Icons.navigation),
                  label: const Text('NAVIGATE'),
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
                ),
              ),
              const SizedBox(width: 12),
              IconButton.filledTonal(onPressed: onCall, icon: const Icon(Icons.call)),
            ],
          ),
        ],
      ),
    ),
  );
}
