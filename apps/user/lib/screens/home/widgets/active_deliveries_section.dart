// lib/widgets/home/active_deliveries_section.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../models/orders/order.dart';
import '../../../utils/app_routes.dart';
import '../../../utils/slide_in_animation.dart';
import '../../orders/widgets/order_card.dart';

class ActiveDeliveriesSection extends StatelessWidget {
  const ActiveDeliveriesSection({required this.orders, required this.onViewAll, super.key});

  final List<Order> orders;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Active Deliveries (${orders.length})', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
              if (orders.isNotEmpty)
                TextButton(
                  onPressed: onViewAll,
                  child: Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 4),
                      Icon(Icons.arrow_forward_ios, size: 14, color: theme.colorScheme.primary),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        // Orders List or Empty State
        if (orders.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: SlideInAnimation(child: _EmptyState(onCreateOrder: () => context.go(AppRoutes.createOrder))),
          )
        else
          SizedBox(
            height: 280, // Fixed height for the carousel
            child: PageView.builder(
              controller: PageController(viewportFraction: 0.9),
              padEnds: false,
              itemCount: orders.length > 5 ? 5 : orders.length,
              itemBuilder: (context, index) {
                final order = orders[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 12, left: 16), // Add padding between cards
                  child: SlideInAnimation(
                    index: index,
                    child: OrderCard(order: order, onTap: () => context.push('/order/${order.orderId}')),
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({required this.onCreateOrder});

  final VoidCallback onCreateOrder;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      width: MediaQuery.of(context).size.width,
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2), width: 2),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Icon(Icons.inventory_2_outlined, size: 48, color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 16),
          Text('No active deliveries', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          Text(
            'Start sending packages with ease',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: onCreateOrder,
            icon: const Icon(Icons.add, size: 20),
            label: const Text('Send Package'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
          ),
        ],
      ),
    );
  }
}
