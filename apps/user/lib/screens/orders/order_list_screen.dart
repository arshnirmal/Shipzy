import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/orders/order.dart';
import '../../services/dio/api_client.dart';
import '../../services/orders_repository.dart';
import 'widgets/empty_state.dart';
import 'widgets/order_card.dart';

// Provider for the repository
final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  final apiClient = ref.watch(apiClientProvider);
  return OrdersRepository(apiClient);
});

// Provider for the orders list
final ordersProvider = FutureProvider.autoDispose.family<List<Order>, Map<String, dynamic>>((ref, params) async {
  final repository = ref.watch(ordersRepositoryProvider);
  return repository.getOrders(page: params['page'] ?? 1, limit: params['limit'] ?? 20, status: params['status']);
});

class OrdersScreen extends ConsumerStatefulWidget {
  const OrdersScreen({super.key});

  @override
  ConsumerState<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends ConsumerState<OrdersScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<String> _tabs = ['All', 'Active', 'Completed', 'Cancelled'];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(_handleTabSelection);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _handleTabSelection() {
    if (_tabController.indexIsChanging) {
      setState(() {});
    }
  }

  String? _getStatusFilter(int index) {
    switch (index) {
      case 1:
        return 'active';
      case 2:
        return 'completed';
      case 3:
        return 'cancelled';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusFilter = _getStatusFilter(_tabController.index);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Orders'),
        bottom: TabBar(
          controller: _tabController,
          tabs: _tabs.map((tab) => Tab(text: tab)).toList(),
          labelColor: theme.colorScheme.primary,
          unselectedLabelColor: theme.textTheme.bodyMedium?.color,
          indicatorColor: theme.colorScheme.primary,
        ),
      ),
      body: _OrderList(status: statusFilter),
    );
  }
}

class _OrderList extends ConsumerWidget {
  const _OrderList({this.status});
  final String? status;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final params = {'page': 1, 'limit': 20, 'status': status};

    final ordersAsyncValue = ref.watch(ordersProvider(params));

    return ordersAsyncValue.when(
      data: (orders) {
        if (orders.isEmpty) {
          return EmptyState(title: 'No orders found', message: 'You don\'t have any ${status ?? ""} orders yet', icon: Icons.inbox_outlined);
        }

        return RefreshIndicator(
          onRefresh: () async => ref.refresh(ordersProvider(params).future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: orders.length,
            itemBuilder: (context, index) {
              final order = orders[index];
              return OrderCard(
                order: order,
                onTap: () {
                  // Navigate to details
                },
                onActionTap: () {
                  // Handle tracking action
                },
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
              ElevatedButton.icon(onPressed: () => ref.refresh(ordersProvider(params)), icon: const Icon(Icons.refresh), label: const Text('Retry')),
            ],
          ),
        ),
      ),
    );
  }
}
