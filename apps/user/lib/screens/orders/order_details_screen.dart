import 'package:flutter/material.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({required this.orderId, super.key});
  final String orderId;

  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Order Details Screen - $orderId')));
}
