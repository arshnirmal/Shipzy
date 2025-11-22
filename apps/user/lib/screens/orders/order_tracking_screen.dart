import 'package:flutter/material.dart';

class OrderTrackingScreen extends StatelessWidget {
  const OrderTrackingScreen({required this.orderId, super.key});
  final String orderId;

  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Order Tracking Screen - $orderId')));
}
