import 'package:json_annotation/json_annotation.dart';

enum OrderStatus {
  @JsonValue('pending')
  pending,
  @JsonValue('accepted')
  accepted,
  @JsonValue('picked_up')
  pickedUp,
  @JsonValue('in_transit')
  inTransit,
  @JsonValue('delivered')
  delivered,
  @JsonValue('cancelled')
  cancelled,
  @JsonValue('undeliverable')
  undeliverable,
  @JsonValue('returned')
  returned,
  @JsonValue('rejected')
  rejected;

  String get label {
    switch (this) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.accepted:
        return 'Accepted';
      case OrderStatus.pickedUp:
        return 'Picked Up';
      case OrderStatus.inTransit:
        return 'In Transit';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.cancelled:
        return 'Cancelled';
      case OrderStatus.undeliverable:
        return 'Undeliverable';
      case OrderStatus.returned:
        return 'Returned';
      case OrderStatus.rejected:
        return 'Rejected';
    }
  }

  bool get isActive => this == OrderStatus.pending || this == OrderStatus.accepted || this == OrderStatus.pickedUp || this == OrderStatus.inTransit;

  bool get isCompleted =>
      this == OrderStatus.delivered ||
      this == OrderStatus.cancelled ||
      this == OrderStatus.undeliverable ||
      this == OrderStatus.returned ||
      this == OrderStatus.rejected;
}

extension OrderStatusX on OrderStatus {
  static OrderStatus fromApi(String value) {
    switch (value) {
      case 'pending':
        return OrderStatus.pending;
      case 'accepted':
        return OrderStatus.accepted;
      case 'picked_up':
        return OrderStatus.pickedUp;
      case 'in_transit':
        return OrderStatus.inTransit;
      case 'delivered':
        return OrderStatus.delivered;
      case 'cancelled':
        return OrderStatus.cancelled;
      case 'undeliverable':
        return OrderStatus.undeliverable;
      case 'returned':
        return OrderStatus.returned;
      case 'rejected':
        return OrderStatus.rejected;
      default:
        return OrderStatus.pending;
    }
  }
}
