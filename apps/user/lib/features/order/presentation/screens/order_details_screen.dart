import 'package:flutter/material.dart';

class OrderDetailsScreen extends StatelessWidget {
  final String orderId;
  
  const OrderDetailsScreen({required this.orderId, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('Order Details Screen - $orderId'),
      ),
    );
  }
}
