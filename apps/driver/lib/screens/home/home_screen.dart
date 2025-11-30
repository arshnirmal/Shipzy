import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/driver_home_state.dart';
import '../../providers/home_provider.dart';
import 'widgets/active_order_card.dart';
import 'widgets/available_order_card.dart';
import 'widgets/quick_actions_grid.dart';
import 'widgets/stats_grid.dart';
import 'widgets/status_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollController = ScrollController();
  bool _isStatusCollapsed = false;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    final shouldCollapse = _scrollController.offset > 100;
    if (shouldCollapse != _isStatusCollapsed) {
      setState(() => _isStatusCollapsed = shouldCollapse);
    }
  }

  @override
  Widget build(BuildContext context) {
    final homeState = ref.watch(driverHomeProvider);
    final dailyStatsAsync = ref.watch(dailyStatsProvider);
    final nearbyOrdersAsync = ref.watch(nearbyOrdersProvider);
    final activeOrderAsync = ref.watch(activeOrderProvider);

    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      appBar: AppBar(
        title: const Text('Shipzy Driver'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
          IconButton(icon: const Icon(Icons.settings_outlined), onPressed: () {}),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh all providers
          ref.invalidate(dailyStatsProvider);
          ref.invalidate(nearbyOrdersProvider);
          ref.invalidate(activeOrderProvider);
          await Future.delayed(const Duration(seconds: 1));
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    StatusCard(
                      status: homeState.status,
                      isLoading: homeState.isLoading,
                      onToggle: () => ref.read(driverHomeProvider.notifier).toggleStatus(),
                    ),

                    if (homeState.error != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 16),
                        child: Text(homeState.error!, style: const TextStyle(color: Colors.red)),
                      ),
                  ],
                ),
              ),
            ),

            // Stats Grid (Show when Online or On Delivery)
            if (homeState.status != DriverStatus.offline)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: dailyStatsAsync.when(
                    data: (stats) => StatsGrid(stats: stats),
                    loading: () => const Center(child: LinearProgressIndicator()),
                    error: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),

            // Active Order Section
            if (homeState.status == DriverStatus.onDelivery || activeOrderAsync.value != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: activeOrderAsync.when(
                    data: (order) => order != null ? ActiveOrderCard(order: order, onNavigate: () {}, onCall: () {}) : const SizedBox.shrink(),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => Text('Error: $err'),
                  ),
                ),
              ),

            // Available Orders Section (Only when Online and NOT on delivery)
            if (homeState.status == DriverStatus.online)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Available Orders', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 16),
                      nearbyOrdersAsync.when(
                        data: (orders) {
                          if (orders.isEmpty) {
                            return const Center(
                              child: Padding(padding: EdgeInsets.all(32), child: Text('No orders nearby...')),
                            );
                          }
                          return Column(
                            children: orders
                                .map(
                                  (order) => AvailableOrderCard(
                                    order: order,
                                    onAccept: () => ref.read(driverHomeProvider.notifier).acceptOrder(order.orderId),
                                    onReject: () => ref.read(driverHomeProvider.notifier).rejectOrder(order.orderId),
                                  ),
                                )
                                .toList(),
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (err, stack) => Text('Error loading orders: $err'),
                      ),
                    ],
                  ),
                ),
              ),

            // Quick Actions (Always visible)
            const SliverToBoxAdapter(
              child: Padding(padding: EdgeInsets.all(16), child: QuickActionsGrid()),
            ),

            const SliverPadding(padding: EdgeInsets.only(bottom: 80)),
          ],
        ),
      ),
    );
  }
}
