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
      case OrderStatus.rejected:
        return 'Rejected';
    }
  }

  bool get isActive => this == OrderStatus.pending || this == OrderStatus.accepted || this == OrderStatus.pickedUp || this == OrderStatus.inTransit;

  bool get isCompleted => this == OrderStatus.delivered || this == OrderStatus.cancelled || this == OrderStatus.rejected;
}
