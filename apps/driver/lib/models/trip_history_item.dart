import 'package:intl/intl.dart';

/// A completed/cancelled/returned trip entry from the driver's history.
/// Mapped from GET /drivers/me/trips response items.
class TripHistoryItem {
  const TripHistoryItem({
    required this.orderId,
    required this.orderNumber,
    required this.status,
    this.netEarning = 0.0,
    this.baseFare = 0.0,
    this.distanceFee = 0.0,
    this.tip = 0.0,
    this.distanceKm = 0.0,
    this.pickupCity,
    this.pickupAddress,
    this.dropCity,
    this.dropAddress,
    this.packageType,
    this.completedAt,
    this.cancelledAt,
    this.returnedAt,
    this.pickedUpAt,
    this.assignedAt,
    this.cancellationReason,
  });

  factory TripHistoryItem.fromJson(Map<String, dynamic> json) {
    final pickup = json['pickup'] as Map<String, dynamic>?;
    final delivery = json['delivery'] as Map<String, dynamic>?;
    final pricing = json['pricing'] as Map<String, dynamic>?;
    final package = json['package'] as Map<String, dynamic>?;

    return TripHistoryItem(
      orderId: json['orderId'] as int,
      orderNumber: json['orderNumber'] as String? ?? '#${json['orderId']}',
      status: json['status'] as String? ?? 'unknown',
      netEarning: (json['earnings'] as num?)?.toDouble() ?? 0.0,
      baseFare: (pricing?['basePrice'] as num?)?.toDouble() ??
          (json['baseFare'] as num?)?.toDouble() ??
          0.0,
      distanceFee: (pricing?['distancePrice'] as num?)?.toDouble() ??
          (json['distanceFee'] as num?)?.toDouble() ??
          0.0,
      tip: (json['tip'] as num?)?.toDouble() ?? 0.0,
      distanceKm: (json['distanceKm'] as num?)?.toDouble() ??
          (pricing?['distanceKm'] as num?)?.toDouble() ??
          0.0,
      pickupCity: pickup?['city'] as String?,
      pickupAddress: pickup?['fullAddress'] as String?,
      dropCity: delivery?['city'] as String?,
      dropAddress: delivery?['fullAddress'] as String?,
      packageType:
          package?['description'] as String? ?? json['packageType'] as String?,
      completedAt:
          json['completedAt'] as String? ?? json['deliveredAt'] as String?,
      cancelledAt: json['cancelledAt'] as String?,
      returnedAt: json['returnedAt'] as String?,
      pickedUpAt: json['pickedUpAt'] as String?,
      assignedAt: json['assignedAt'] as String?,
      cancellationReason: json['cancellationReason'] as String?,
    );
  }

  final int orderId;
  final String orderNumber;

  /// Backend status: delivered | cancelled | returned | undeliverable
  final String status;

  final double netEarning;
  final double baseFare;
  final double distanceFee;
  final double tip;
  final double distanceKm;

  final String? pickupCity;
  final String? pickupAddress;
  final String? dropCity;
  final String? dropAddress;
  final String? packageType;

  final String? completedAt;
  final String? cancelledAt;
  final String? returnedAt;
  final String? pickedUpAt;
  final String? assignedAt;
  final String? cancellationReason;

  // ── Derived helpers ──────────────────────────────────────────────────────────

  String get displayPickup => pickupCity ?? pickupAddress ?? 'Unknown';
  String get displayDrop => dropCity ?? dropAddress ?? 'Unknown';

  String? get effectiveTimestamp => completedAt ?? cancelledAt ?? returnedAt;

  /// Returns one of: 'today' | 'yesterday' | 'week' | 'earlier'
  String get dateGroup {
    final raw = effectiveTimestamp;
    if (raw == null) {
      return 'earlier';
    }
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) {
      return 'earlier';
    }
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final yesterday = today.subtract(const Duration(days: 1));
    final weekStart = today.subtract(Duration(days: now.weekday - 1));
    final day = DateTime(dt.year, dt.month, dt.day);
    if (day == today) {
      return 'today';
    }
    if (day == yesterday) {
      return 'yesterday';
    }
    if (!day.isBefore(weekStart)) {
      return 'week';
    }
    return 'earlier';
  }

  String get dateGroupLabel {
    final raw = effectiveTimestamp;
    final dt = raw != null ? DateTime.tryParse(raw)?.toLocal() : null;
    if (dt == null) {
      return 'Earlier';
    }
    final shortDate = DateFormat('MMM d').format(dt);
    switch (dateGroup) {
      case 'today':
        return 'Today, $shortDate';
      case 'yesterday':
        return 'Yesterday, $shortDate';
      case 'week':
        return 'This Week';
      default:
        return 'Earlier';
    }
  }

  String get formattedTime {
    final raw = effectiveTimestamp;
    if (raw == null) {
      return '';
    }
    final dt = DateTime.tryParse(raw)?.toLocal();
    if (dt == null) {
      return '';
    }
    return DateFormat('h:mm a').format(dt);
  }
}
