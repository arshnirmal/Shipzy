// lib/widgets/home/recent_activity_section.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../models/orders/order.dart';
import '../../../utils/slide_in_animation.dart';
import '../../orders/widgets/order_card.dart';

class RecentActivitySection extends StatelessWidget {
  const RecentActivitySection({required this.orders, required this.onViewAll, super.key});

  final List<Order> orders;
  final VoidCallback onViewAll;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (orders.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section Header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Recent Activity', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
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
        // Recent Orders List
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          itemCount: orders.length > 5 ? 5 : orders.length,
          itemBuilder: (context, index) => SlideInAnimation(
            index: index,
            child: OrderCard(order: orders[index], onTap: () => context.push('/order/${orders[index].orderId}')),
          ),
        ),
      ],
    );
  }
}
