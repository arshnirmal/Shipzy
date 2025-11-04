// lib/screens/orders/orders_list_screen.dart

import 'package:flutter/material.dart';

class OrdersListScreen extends StatelessWidget {
  const OrdersListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long_outlined, size: 80, color: theme.colorScheme.primary),
            const SizedBox(height: 24),
            Text('Orders List', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text('Coming Soon', style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6))),
          ],
        ),
      ),
    );
  }
}
