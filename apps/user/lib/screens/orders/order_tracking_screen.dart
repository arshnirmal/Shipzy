import 'package:flutter/material.dart';

class OrderTrackingScreen extends StatelessWidget {
  final String orderId;

  const OrderTrackingScreen({required this.orderId, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(child: Text('Order Tracking Screen - $orderId')),
    );
  }
}
