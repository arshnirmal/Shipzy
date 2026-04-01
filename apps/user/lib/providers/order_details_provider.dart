// lib/providers/order_details_provider.dart

import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/orders/order.dart';
import '../models/orders/order_status.dart';
import 'order_service_provider.dart';

part 'order_details_provider.g.dart';

@riverpod
class OrderDetails extends _$OrderDetails {
  Timer? refreshTimer;

  @override
  Future<Order> build(int orderId) async {
    ref.onDispose(() {
      refreshTimer?.cancel();
    });

    final order = await fetchOrder(orderId);
    setupAutoRefresh(order.status);
    return order;
  }

  Future<Order> fetchOrder(int orderId) async {
    final orderService = ref.read(orderServiceProvider);
    try {
      final response = await orderService.getOrderDetails(orderId);
      return response.data;
    } catch (e) {
      throw Exception('Failed to fetch order: $e');
    }
  }

  void setupAutoRefresh(OrderStatus status) {
    refreshTimer?.cancel();
    final interval = getRefreshInterval(status);

    if (interval > Duration.zero) {
      refreshTimer = Timer.periodic(interval, (_) {
        refresh();
      });
    }
  }

  Duration getRefreshInterval(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return const Duration(seconds: 30);
      case OrderStatus.accepted:
        return const Duration(seconds: 10);
      case OrderStatus.pickedUp:
        return const Duration(seconds: 5);
      case OrderStatus.inTransit:
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return Duration.zero; // No auto-refresh for completed/cancelled/failed
    }
  }

  Future<void> refresh() async {
    final orderId = state.value?.orderId;
    if (orderId != null) {
      state = await AsyncValue.guard(() async {
        final order = await fetchOrder(orderId);
        setupAutoRefresh(order.status);
        return order;
      });
    }
  }
}
