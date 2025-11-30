import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'order_provider.g.dart';

@riverpod
class Order extends _$Order {
  @override
  OrderState build() {
    return OrderState();
  }

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
    state = state.copyWith(status: OrderStatus.completed, activeOrderId: null);
  }
}

enum OrderStatus { idle, accepted, navigatingToPickup, arrivedAtPickup, pickedUp, navigatingToDropoff, arrivedAtDropoff, completed }

class OrderState {
  final String? activeOrderId;
  final OrderStatus status;

  OrderState({this.activeOrderId, this.status = OrderStatus.idle});

  OrderState copyWith({String? activeOrderId, OrderStatus? status}) {
    return OrderState(activeOrderId: activeOrderId ?? this.activeOrderId, status: status ?? this.status);
  }
}
