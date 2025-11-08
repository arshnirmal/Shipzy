// lib/screens/home/home_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/orders_provider.dart';
import '../../utils/app_routes.dart';
import '../../widgets/home/active_deliveries_section.dart';
import '../../widgets/home/cta_card.dart';
import '../../widgets/home/home_app_bar.dart';
import '../../widgets/home/recent_activity_section.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersState = ref.watch(ordersProvider);
    final theme = Theme.of(context);

    return Scaffold(
      appBar: const HomeAppBar(), // ✅ Use the new AppBar widget
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: () => ref.read(ordersProvider.notifier).refresh(),
          child: ordersState.when(
            data: (orders) {
              final ordersNotifier = ref.read(ordersProvider.notifier);
              final activeOrders = ordersNotifier.activeOrders;
              final completedOrders = ordersNotifier.completedOrders;

              return CustomScrollView(
                slivers: [
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),

                  // CTA Card
                  const SliverToBoxAdapter(child: CTACard()),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),

                  // Active Deliveries Section
                  SliverToBoxAdapter(
                    child: ActiveDeliveriesSection(orders: activeOrders, onViewAll: () => context.go(AppRoutes.orderList)),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),

                  // Recent Activity Section
                  SliverToBoxAdapter(
                    child: RecentActivitySection(orders: completedOrders, onViewAll: () => context.go(AppRoutes.orderList)),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 24)),
                ],
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
                  const SizedBox(height: 16),
                  Text('Failed to load orders', style: theme.textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(error.toString(), style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () => ref.read(ordersProvider.notifier).refresh(),
                    icon: const Icon(Icons.refresh),
                    label: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
