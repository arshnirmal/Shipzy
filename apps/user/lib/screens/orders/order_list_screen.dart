import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../models/orders/order_list_item.dart';
import '../../models/orders/order_status.dart';
import '../../providers/orders_provider.dart';
import '../../utils/app_routes.dart';
import '../../utils/slide_in_animation.dart';
import 'widgets/empty_state.dart';
import 'widgets/order_card.dart';

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> {
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final ordersState = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Orders')),
      body: Column(
        children: [
          // Filter Tabs
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: _filters.map((filter) {
                  final cs = theme.colorScheme;
                  final isDark = theme.brightness == Brightness.dark;
                  final selectedBg = isDark ? Color.alphaBlend(cs.primary.withValues(alpha: 0.16), cs.surface) : cs.primary.withValues(alpha: 0.10);
                  final isSelected = _selectedFilter == filter;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: InkWell(
                      borderRadius: BorderRadius.circular(20),
                      onTap: () {
                        HapticFeedback.selectionClick();
                        setState(() {
                          _selectedFilter = filter;
                        });
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        curve: Curves.easeOutCubic,
                        child: ChoiceChip(
                          label: Text(filter),
                          selected: isSelected,
                          selectedColor: selectedBg,
                          backgroundColor: cs.surface,
                          side: BorderSide(color: isSelected ? cs.primary : cs.outlineVariant, width: isSelected ? 2 : 1),
                          labelStyle: TextStyle(
                            color: isSelected ? cs.onSurface : cs.onSurface.withValues(alpha: 0.90),
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                          ),
                          showCheckmark: false,
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ),
          ),
          // Order List
          Expanded(
            child: ordersState.when(
              data: (allOrders) {
                // Filter orders based on selected filter
                final orders = _getFilteredOrders(allOrders);

                if (orders.isEmpty) {
                  return EmptyState(
                    title: 'No orders found',
                    message: 'You don\'t have any ${_selectedFilter.toLowerCase()} orders yet',
                    icon: Icons.inbox_outlined,
                    action: ElevatedButton.icon(
                      onPressed: () => context.go(AppRoutes.createOrder),
                      icon: const Icon(Icons.add),
                      label: const Text('Create Order'),
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(ordersProvider.notifier).refresh(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final order = orders[index];
                      return SlideInAnimation(
                        index: index,
                        child: OrderCard(
                          order: order,
                          onTap: () => context.push('/order/${order.orderId}'),
                          onActionTap: () {
                            // Handle tracking action
                          },
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
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
        ],
      ),
    );
  }

  List<OrderListItem> _getFilteredOrders(List<OrderListItem> allOrders) {
    final ordersNotifier = ref.read(ordersProvider.notifier);

    switch (_selectedFilter) {
      case 'Active':
        return ordersNotifier.activeOrders;
      case 'Completed':
        return ordersNotifier.completedOrders;
      case 'Cancelled':
        return allOrders
            .where(
              (order) =>
                  order.status == OrderStatus.cancelled ||
                  order.status == OrderStatus.rejected ||
                  order.status == OrderStatus.undeliverable ||
                  order.status == OrderStatus.returned,
            )
            .toList();
      default:
        return allOrders;
    }
  }
}
