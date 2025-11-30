import 'package:flutter/material.dart';

class OrdersListScreen extends StatelessWidget {
  const OrdersListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Orders'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Active'),
              Tab(text: 'History'),
              Tab(text: 'Scheduled'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            Center(child: Text('No active orders')),
            Center(child: Text('No order history')),
            Center(child: Text('No scheduled orders')),
          ],
        ),
      ),
    );
  }
}
