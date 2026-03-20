import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/driver_home_state.dart';
import '../../providers/home_provider.dart';
import '../../services/api_service.dart';
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
    final driverProfileAsync = ref.watch(driverProfileProvider);

    final theme = Theme.of(context);

    final isOnDelivery = homeState.status == DriverStatus.onDelivery || activeOrderAsync.value != null;

    return Scaffold(
      // backgroundColor: theme.scaffoldBackgroundColor, // Default behavior
      appBar: AppBar(
        leading: Padding(
          padding: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
          child: driverProfileAsync.when(
            data: (profile) => CircleAvatar(
              backgroundImage: profile.profilePictureUrl != null ? NetworkImage(profile.profilePictureUrl!) : null,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: profile.profilePictureUrl == null
                  ? Text(
                      profile.fullName.isNotEmpty ? profile.fullName[0].toUpperCase() : '?',
                      style: TextStyle(color: theme.colorScheme.onPrimaryContainer, fontWeight: FontWeight.bold),
                    )
                  : null,
            ),
            loading: () => const CircleAvatar(child: CircularProgressIndicator()),
            error: (_, __) => const CircleAvatar(child: Icon(Icons.person)),
          ),
        ),
        title: driverProfileAsync.when(
          data: (profile) {
            final status = homeState.status;
            Color pillColor;
            Color pillBorder;
            Color textColor;
            String label;
            IconData icon;

            if (status == DriverStatus.onDelivery) {
              pillColor = Colors.orange.withValues(alpha: 0.12);
              pillBorder = Colors.orange;
              textColor = Colors.orange;
              label = 'In Transit';
              icon = Icons.directions_bike;
            } else if (status == DriverStatus.online) {
              pillColor = Colors.green.withValues(alpha: 0.12);
              pillBorder = Colors.green;
              textColor = Colors.green;
              label = 'Online';
              icon = Icons.circle;
            } else {
              pillColor = theme.colorScheme.surfaceContainerHighest;
              pillBorder = theme.dividerColor;
              textColor = theme.textTheme.bodyMedium?.color ?? Colors.grey;
              label = 'Offline';
              icon = Icons.circle_outlined;
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Name and Status Row
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        profile.fullName,
                        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Status Pill (Display Only)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: pillColor,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: pillBorder),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(icon, size: 12, color: textColor),
                          const SizedBox(width: 4),
                          Text(
                            label,
                            style: theme.textTheme.labelSmall?.copyWith(color: textColor, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                // Vehicle / Zone Info
                if (profile.vehicle != null)
                  Text(
                    '${profile.vehicle!.model} • ${profile.vehicle!.vehicleNumber}',
                    style: theme.textTheme.bodySmall?.copyWith(color: theme.textTheme.bodySmall?.color?.withValues(alpha: 0.7)),
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            );
          },
          loading: () => const SizedBox.shrink(),
          error: (_, __) => const Text('Shipzy Driver'),
        ),
        actions: [
          // SOS / Shield
          IconButton(
            onPressed: () {
              // TODO: Implement SOS
            },
            icon: const Icon(Icons.shield_outlined),
            tooltip: 'Safety Toolkit',
          ),
          // Notifications
          IconButton(
            onPressed: () {
              // TODO: Open notifications
            },
            icon: const Badge(label: Text('2'), child: Icon(Icons.notifications_outlined)),
            tooltip: 'Notifications',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          // Refresh all providers
          ref.invalidate(dailyStatsProvider);
          ref.invalidate(nearbyOrdersProvider);
          ref.invalidate(activeOrderProvider);
          ref.invalidate(driverProfileProvider);
          await Future.delayed(const Duration(seconds: 1));
        },
        child: CustomScrollView(
          controller: _scrollController,
          slivers: isOnDelivery
              ? [
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
                                onMarkPickedUp: () async {
                                  try {
                                    await ref.read(apiServiceProvider).updateOrderStatus(order.orderId, 'picked_up');
                                    ref.invalidate(activeOrderProvider);
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update order status: $e')));
                                  }
                                },
                                onMarkDelivered: () async {
                                  try {
                                    await ref.read(apiServiceProvider).updateOrderStatus(order.orderId, 'delivered');
                                    ref.invalidate(activeOrderProvider);
                                    ref.invalidate(dailyStatsProvider);
                                  } catch (e) {
                                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update order status: $e')));
                                  }
                                },
                              )
                            : const SizedBox.shrink(),
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (err, stack) => Text('Error: $err'),
                      ),
                    ),
                  ),
                  const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
                ]
              : [
                  // Status Card
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: driverProfileAsync.when(
                        data: (profile) => StatusCard(
                          status: homeState.status,
                          isLoading: homeState.isLoading,
                          driverName: profile.fullName,
                          // Location display hidden for MVP - TODO: Add reverse geocoding later
                          onlineDuration: homeState.status == DriverStatus.online ? const Duration(hours: 2, minutes: 15) : null,
                          onToggle: () => ref.read(driverHomeProvider.notifier).toggleStatus(),
                        ),
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (e, s) => Container(
                          padding: const EdgeInsets.all(16),
                          color: theme.colorScheme.errorContainer,
                          child: Text('Profile Error: $e', style: TextStyle(color: theme.colorScheme.error)),
                        ),
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
                            color: theme.colorScheme.errorContainer,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.3)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.error_outline, color: theme.colorScheme.error),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(homeState.error!, style: TextStyle(color: theme.colorScheme.error)),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                  // Stats Grid
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: dailyStatsAsync.when(
                        data: (stats) => StatsGrid(stats: stats),
                        loading: () => const Center(child: LinearProgressIndicator()),
                        error: (err, stack) => Text('Error loading stats: $err', style: TextStyle(color: theme.colorScheme.error)),
                      ),
                    ),
                  ),

                  // Active Order Section (if any, but not forcing full-screen)
                  if (activeOrderAsync.value != null)
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
                                  onMarkPickedUp: () async {
                                    try {
                                      await ref.read(apiServiceProvider).updateOrderStatus(order.orderId, 'picked_up');
                                      ref.invalidate(activeOrderProvider);
                                    } catch (e) {
                                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update order status: $e')));
                                    }
                                  },
                                  onMarkDelivered: () async {
                                    try {
                                      await ref.read(apiServiceProvider).updateOrderStatus(order.orderId, 'delivered');
                                      ref.invalidate(activeOrderProvider);
                                      ref.invalidate(dailyStatsProvider);
                                    } catch (e) {
                                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to update order status: $e')));
                                    }
                                  },
                                )
                              : const SizedBox.shrink(),
                          loading: () => const Center(child: CircularProgressIndicator()),
                          error: (err, stack) => Text('Error: $err'),
                        ),
                      ),
                    ),

                  // Available Orders Section (Only when Online)
                  if (homeState.status == DriverStatus.online && activeOrderAsync.value == null)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            nearbyOrdersAsync.when(
                              data: (orders) => Text(
                                '📍 Available Orders Nearby (${orders.length})',
                                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                              ),
                              loading: () =>
                                  Text('📍 Available Orders Nearby', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                              error: (err, stack) => Text(
                                '📍 Available Orders Nearby (Error)',
                                style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                              ),
                            ),
                            const SizedBox(height: 16),
                            nearbyOrdersAsync.when(
                              data: (orders) {
                                if (orders.isEmpty) {
                                  return Container(
                                    padding: const EdgeInsets.all(32),
                                    decoration: BoxDecoration(
                                      color: theme.cardColor,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: theme.dividerColor),
                                    ),
                                    child: Center(
                                      child: Column(
                                        children: [
                                          Icon(Icons.search_off, size: 48, color: theme.disabledColor),
                                          const SizedBox(height: 16),
                                          Text('No orders nearby...', style: theme.textTheme.bodyLarge?.copyWith(color: theme.disabledColor)),
                                          const SizedBox(height: 8),
                                          Text(
                                            'Orders will appear here when available',
                                            style: theme.textTheme.bodyMedium?.copyWith(color: theme.disabledColor),
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
                                  color: theme.colorScheme.errorContainer,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: theme.colorScheme.error.withValues(alpha: 0.3)),
                                ),
                                child: Center(
                                  child: Text(
                                    'Error loading orders: $err',
                                    style: TextStyle(color: theme.colorScheme.error),
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
                                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                  // Quick Actions
                  const SliverToBoxAdapter(
                    child: Padding(padding: EdgeInsets.all(16), child: QuickActionsGrid()),
                  ),

                  // Bottom padding for navigation
                  const SliverPadding(padding: EdgeInsets.only(bottom: 100)),
                ],
        ),
      ),
    );
  }
}
