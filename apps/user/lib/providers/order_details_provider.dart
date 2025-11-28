// lib/providers/order_details_provider.dart

import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/orders/order.dart';
import '../models/orders/order_status.dart';
import 'order_service_provider.dart';

part 'order_details_provider.g.dart';

@riverpod
class OrderDetails extends _$OrderDetails {
  Timer? _refreshTimer;

  @override
  Future<Order> build(int orderId) async {
    ref.onDispose(() {
      _refreshTimer?.cancel();
    });

    final order = await _fetchOrder(orderId);
    _setupAutoRefresh(order.status);
    return order;
  }

  Future<Order> _fetchOrder(int orderId) async {
    final orderService = ref.read(orderServiceProvider);
    try {
      final response = await orderService.getOrderDetails(orderId);
      return response.data;
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  void _setupAutoRefresh(OrderStatus status) {
    _refreshTimer?.cancel();
    final interval = _getRefreshInterval(status);

    if (interval > Duration.zero) {
      _refreshTimer = Timer.periodic(interval, (_) {
        refresh();
      });
    }
  }

  Duration _getRefreshInterval(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return const Duration(seconds: 30);
      case OrderStatus.accepted:
        return const Duration(seconds: 10);
      case OrderStatus.pickedUp:
        return const Duration(seconds: 5);
      default:
        return Duration.zero; // No auto-refresh for completed/cancelled/failed
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    final orderId = state.value?.orderId;
    if (orderId != null) {
      state = await AsyncValue.guard(() async {
        final order = await _fetchOrder(orderId);
        _setupAutoRefresh(order.status);
        return order;
      });
    }
  }
}
