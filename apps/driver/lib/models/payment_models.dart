import 'package:freezed_annotation/freezed_annotation.dart';

part 'payment_models.freezed.dart';
part 'payment_models.g.dart';

/// Payment mode enum values from the backend.
abstract final class PaymentModeValues {
  static const String prepaid = 'prepaid';
  static const String collectOnDelivery = 'collect_on_delivery';
}

/// Payment status enum values from the backend.
abstract final class PaymentStatusValues {
  static const String pending = 'pending';
  static const String completed = 'completed';
  static const String failed = 'failed';
  static const String refunded = 'refunded';
}

/// Mirrors API paymentInfo block from GET /orders/:id
@freezed
class PaymentInfo with _$PaymentInfo {
  const PaymentInfo._();

  const factory PaymentInfo({
    required String paymentMode,
    required String paymentStatus,
    int? transactionId,
    String? paidAt,
  }) = _PaymentInfo;

  factory PaymentInfo.fromJson(Map<String, dynamic> json) =>
      _$PaymentInfoFromJson(json);

  bool get isPrepaid => paymentMode == PaymentModeValues.prepaid;
  bool get isCollectOnDelivery =>
      paymentMode == PaymentModeValues.collectOnDelivery;
  bool get isPaid => paymentStatus == PaymentStatusValues.completed;
  bool get isPending => paymentStatus == PaymentStatusValues.pending;

  String get displayMode => isPrepaid ? 'Prepaid' : 'Collect on Delivery';

  String get displayStatus {
    switch (paymentStatus) {
      case PaymentStatusValues.pending:
        return 'Pending';
      case PaymentStatusValues.completed:
        return 'Paid';
      case PaymentStatusValues.failed:
        return 'Failed';
      case PaymentStatusValues.refunded:
        return 'Refunded';
      default:
        return paymentStatus;
    }
  }
}

/// Response from POST /payments/generate-qr
@freezed
class QRCodeResult with _$QRCodeResult {
  const factory QRCodeResult({
    required String qrId,
    required String imageUrl,
    required double amount,
    required String expiresAt,
    required int orderId,
  }) = _QRCodeResult;

  factory QRCodeResult.fromJson(Map<String, dynamic> json) =>
      _$QRCodeResultFromJson(json);
}

/// Response from GET /payments/order/:orderId/status
@freezed
class PaymentStatusResult with _$PaymentStatusResult {
  const PaymentStatusResult._();

  const factory PaymentStatusResult({
    required int orderId,
    required String paymentMode,
    required String paymentStatus,
    double? amount,
    String? currency,
    String? paymentMethod,
    int? transactionId,
    String? externalTransactionId,
    String? paidAt,
    String? qrCodeId,
    String? qrImageUrl,
    String? qrExpiresAt,
  }) = _PaymentStatusResult;

  factory PaymentStatusResult.fromJson(Map<String, dynamic> json) =>
      _$PaymentStatusResultFromJson(json);

  bool get isPaid => paymentStatus == PaymentStatusValues.completed;
  bool get isPending => paymentStatus == PaymentStatusValues.pending;
  bool get isCollectOnDelivery =>
      paymentMode == PaymentModeValues.collectOnDelivery;
}

/// Earnings entry from GET /payments/driver/earnings
@freezed
class PaymentEarningsEntry with _$PaymentEarningsEntry {
  const factory PaymentEarningsEntry({
    required int ledgerId,
    required int orderId,
    required double grossAmount,
    required double commissionPct,
    required double commissionAmt,
    required double netAmount,
    required String status,
    required String earnedAt,
  }) = _PaymentEarningsEntry;

  factory PaymentEarningsEntry.fromJson(Map<String, dynamic> json) =>
      _$PaymentEarningsEntryFromJson(json);
}

/// Response from GET /payments/driver/earnings
@freezed
class PaymentEarningsResponse with _$PaymentEarningsResponse {
  const factory PaymentEarningsResponse({
    required String period,
    required int totalDeliveries,
    required double grossEarnings,
    required double totalCommission,
    required double netEarnings,
    required double pendingSettlement,
    required List<PaymentEarningsEntry> entries,
  }) = _PaymentEarningsResponse;

  factory PaymentEarningsResponse.fromJson(Map<String, dynamic> json) =>
      _$PaymentEarningsResponseFromJson(json);
}

/// Payout record from GET /payments/driver/payouts
@freezed
class PayoutRecord with _$PayoutRecord {
  const factory PayoutRecord({
    required int payoutId,
    required int totalDeliveries,
    required double grossAmount,
    required double totalCommission,
    required double netAmount,
    required String payoutMethod,
    required String status,
    required String payoutDate,
    String? completedAt,
  }) = _PayoutRecord;

  factory PayoutRecord.fromJson(Map<String, dynamic> json) =>
      _$PayoutRecordFromJson(json);
}

/// Response from GET /payments/driver/payouts
@freezed
class PayoutListResponse with _$PayoutListResponse {
  const factory PayoutListResponse({
    required List<PayoutRecord> payouts,
    required PayoutPagination pagination,
  }) = _PayoutListResponse;

  factory PayoutListResponse.fromJson(Map<String, dynamic> json) =>
      _$PayoutListResponseFromJson(json);
}

@freezed
class PayoutPagination with _$PayoutPagination {
  const factory PayoutPagination({
    required int page,
    required int limit,
    required int total,
    required int totalPages,
  }) = _PayoutPagination;

  factory PayoutPagination.fromJson(Map<String, dynamic> json) =>
      _$PayoutPaginationFromJson(json);
}
