// lib/screens/placeholder/order_details_screen.dart

import 'package:flutter/material.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({required this.orderId, super.key});

  final String orderId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Details')),

      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,

          children: [
            const Text('Order Details Screen - Coming Soon'),

            const SizedBox(height: 16),

            Text('Order ID: $orderId'),
          ],
        ),
      ),
    );
  }
}
