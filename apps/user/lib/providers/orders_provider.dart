// lib/providers/orders_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../../../models/orders/order_list_item.dart';
import '../../../models/orders/order_status.dart';
import 'order_service_provider.dart';

part 'orders_provider.g.dart';

@Riverpod(keepAlive: true)
class Orders extends _$Orders {
  @override
  Future<List<OrderListItem>> build() async => fetchOrders();

  Future<List<OrderListItem>> fetchOrders({String? status}) async {
    final orderService = ref.read(orderServiceProvider);
    try {
      final response = await orderService.fetchOrders(status: status);
      return response.data;
    } catch (e) {
      throw Exception('Failed to fetch orders: $e');
    }
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async => fetchOrders());
  }

  List<OrderListItem> get activeOrders => state.maybeWhen(
    data: (orders) => orders
        .where(
          (order) =>
              order.status == OrderStatus.pending ||
              order.status == OrderStatus.accepted ||
              order.status == OrderStatus.pickedUp ||
              order.status == OrderStatus.inTransit,
        )
        .toList(),
    orElse: () => [],
  );

  List<OrderListItem> get completedOrders => state.maybeWhen(
    data: (orders) => orders
        .where(
          (order) =>
              order.status == OrderStatus.delivered ||
              order.status == OrderStatus.cancelled ||
              order.status == OrderStatus.rejected ||
              order.status == OrderStatus.undeliverable ||
              order.status == OrderStatus.returned,
        )
        .toList(),
    orElse: () => [],
  );
}
