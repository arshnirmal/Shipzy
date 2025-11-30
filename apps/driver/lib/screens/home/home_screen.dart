import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/driver_home_state.dart';
import '../../providers/home_provider.dart';
import 'widgets/active_order_card.dart';
import 'widgets/available_order_card.dart';
import 'widgets/mini_status_banner.dart';
import 'widgets/quick_actions_grid.dart';
import 'widgets/recent_activity_section.dart';
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
        title: const Text('📱 Shipzy Driver'),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // TODO: Open notifications
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              // TODO: Open settings
            },
          ),
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
            // Status Card (Collapsible)
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: _isStatusCollapsed
                    ? MiniStatusBanner(
                        status: homeState.status,
                        isLoading: homeState.isLoading,
                        onToggle: () => ref.read(driverHomeProvider.notifier).toggleStatus(),
                      )
                    : StatusCard(
                        status: homeState.status,
                        isLoading: homeState.isLoading,
                        driverName: 'Amit', // TODO: Get from profile
                        location: 'Andheri West', // TODO: Get from location
                        onlineDuration: homeState.status == DriverStatus.online ? const Duration(hours: 2, minutes: 15) : null,
                        onToggle: () => ref.read(driverHomeProvider.notifier).toggleStatus(),
                      ),
              ),
            ),

            // Error display
            if (homeState.error != null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade200),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            homeState.error!,
                            style: const TextStyle(color: Colors.red),
                          ),
                        ),
                      ],
                    ),
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
                    data: (order) => order != null
                        ? ActiveOrderCard(
                            order: order,
                            onNavigate: () {
                              // TODO: Open navigation
                            },
                            onCall: () {
                              // TODO: Call customer
                            },
                          )
                        : const SizedBox.shrink(),
                    loading: () => const Center(child: CircularProgressIndicator()),
                    error: (err, stack) => Text('Error: $err'),
                  ),
                ),
              ),

            // Available Orders Section (Only when Online and NOT on delivery)
            if (homeState.status == DriverStatus.online && activeOrderAsync.value == null)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '📍 Available Orders Nearby (3)',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      nearbyOrdersAsync.when(
                        data: (orders) {
                          if (orders.isEmpty) {
                            return Container(
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: Colors.grey.shade200),
                              ),
                              child: const Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.search_off, size: 48, color: Colors.grey),
                                    SizedBox(height: 16),
                                    Text(
                                      'No orders nearby...',
                                      style: TextStyle(fontSize: 16, color: Colors.grey),
                                    ),
                                    SizedBox(height: 8),
                                    Text(
                                      'Orders will appear here when available',
                                      style: TextStyle(fontSize: 12, color: Colors.grey),
                                      textAlign: TextAlign.center,
                                    ),
                                  ],
                                ),
                              ),
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
                        loading: () => Container(
                          padding: const EdgeInsets.all(32),
                          child: const Center(child: CircularProgressIndicator()),
                        ),
                        error: (err, stack) => Container(
                          padding: const EdgeInsets.all(32),
                          decoration: BoxDecoration(
                            color: Colors.red.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.red.shade200),
                          ),
                          child: Center(
                            child: Text(
                              'Error loading orders: $err',
                              style: const TextStyle(color: Colors.red),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                      ),

                      // Refresh button
                      const SizedBox(height: 16),
                      Center(
                        child: TextButton.icon(
                          onPressed: () {
                            ref.invalidate(nearbyOrdersProvider);
                          },
                          icon: const Icon(Icons.refresh),
                          label: const Text('🔄 Refresh Orders'),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // Recent Activity Section (Only when Offline)
            if (homeState.status == DriverStatus.offline)
              const SliverToBoxAdapter(
                child: RecentActivitySection(),
              ),

            // Quick Actions (Always visible)
            const SliverToBoxAdapter(
              child: Padding(padding: EdgeInsets.all(16), child: QuickActionsGrid()),
            ),

            // Bottom padding for navigation
            const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
          ],
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0, // Home tab
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.assignment),
            label: 'Orders',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.attach_money),
            label: 'Earnings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
        onTap: (index) {
          // TODO: Navigate to different tabs
        },
      ),
    );
  }
}
