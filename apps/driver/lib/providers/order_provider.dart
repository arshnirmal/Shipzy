import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'order_provider.g.dart';

@riverpod
class Order extends _$Order {
  @override
  OrderState build() => OrderState();

  Future<void> acceptOrder(String orderId) async {
    // TODO: Call API to accept order
    state = state.copyWith(activeOrderId: orderId, status: OrderStatus.accepted);
  }

  Future<void> rejectOrder(String orderId) async {
    // TODO: Call API to reject order
  }

  Future<void> startNavigation(String orderId) async {
    state = state.copyWith(status: OrderStatus.navigatingToPickup);
  }

  Future<void> confirmPickup(String orderId) async {
    state = state.copyWith(status: OrderStatus.pickedUp);
  }

  Future<void> completeDelivery(String orderId) async {
    state = state.copyWith(status: OrderStatus.completed);
  }
}

enum OrderStatus { idle, accepted, navigatingToPickup, arrivedAtPickup, pickedUp, navigatingToDropoff, arrivedAtDropoff, completed }

class OrderState {
  OrderState({this.activeOrderId, this.status = OrderStatus.idle});
  final String? activeOrderId;
  final OrderStatus status;

  OrderState copyWith({String? activeOrderId, OrderStatus? status}) =>
      OrderState(activeOrderId: activeOrderId ?? this.activeOrderId, status: status ?? this.status);
}
