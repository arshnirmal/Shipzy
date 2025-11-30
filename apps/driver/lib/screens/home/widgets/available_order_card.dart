import 'package:flutter/material.dart';

import '../../../models/available_order.dart';

class AvailableOrderCard extends StatelessWidget {
  const AvailableOrderCard({required this.order, required this.onAccept, required this.onReject, super.key});
  final AvailableOrder order;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) => Card(
    margin: const EdgeInsets.only(bottom: 16),
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    child: Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.location_on, color: Colors.blue, size: 20),
                  const SizedBox(width: 4),
                  Text('${order.distance.toStringAsFixed(1)} km away', style: const TextStyle(fontWeight: FontWeight.bold)),
                ],
              ),
              Text(
                '₹${order.fare.toStringAsFixed(0)}',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildLocationRow(Icons.my_location, order.pickupAddress),
          const SizedBox(height: 8),
          _buildLocationRow(Icons.flag, order.deliveryAddress),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildChip(Icons.two_wheeler, order.vehicleType),
              const SizedBox(width: 8),
              _buildChip(Icons.inventory_2, order.packageType),
              const Spacer(),
              Text(
                'Expires in ${order.expiresInSeconds}s',
                style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: onReject,
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  child: const Text('REJECT'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: onAccept,
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green, foregroundColor: Colors.white),
                  child: const Text('ACCEPT'),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );

  Widget _buildLocationRow(IconData icon, String text) => Row(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Icon(icon, size: 16, color: Colors.grey),
      const SizedBox(width: 8),
      Expanded(
        child: Text(text, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 14)),
      ),
    ],
  );

  Widget _buildChip(IconData icon, String label) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
    child: Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade700),
        const SizedBox(width: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
      ],
    ),
  );
}
