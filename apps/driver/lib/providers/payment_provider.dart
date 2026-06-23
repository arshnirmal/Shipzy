import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/payment_models.dart';
import '../services/api_service.dart';

// ── Payment status for a specific order ─────────────────────────────────────

final paymentStatusProvider =
    FutureProvider.autoDispose.family<PaymentStatusResult, int>((ref, orderId) {
  return ref.read(apiServiceProvider).getPaymentStatus(orderId);
});

// ── QR Code generation ──────────────────────────────────────────────────────

/// Generates a UPI QR code for collect-on-delivery.
/// Auto-disposes when the widget that requested it unmounts.
final collectionQRProvider =
    FutureProvider.autoDispose.family<QRCodeResult, int>((ref, orderId) {
  return ref.read(apiServiceProvider).generateCollectionQR(orderId);
});

// ── Payment earnings (from payments module) ─────────────────────────────────

final paymentEarningsProvider =
    FutureProvider.autoDispose.family<PaymentEarningsResponse, String>(
  (ref, period) {
    return ref.read(apiServiceProvider).getPaymentEarnings(period);
  },
);

// ── Payout history ──────────────────────────────────────────────────────────

final payoutHistoryProvider =
    FutureProvider.autoDispose<PayoutListResponse>((ref) {
  return ref.read(apiServiceProvider).getDriverPayouts();
});

// ── Payment polling (for QR-based collection) ───────────────────────────────

/// Polls payment status every 5 seconds for an order.
/// Use this when showing the QR code screen to detect when the customer pays.
class PaymentPollingNotifier extends AutoDisposeFamilyAsyncNotifier<PaymentStatusResult, int> {
  Timer? _timer;

  @override
  Future<PaymentStatusResult> build(int arg) async {
    ref.onDispose(() {
      _timer?.cancel();
    });

    final result = await ref.read(apiServiceProvider).getPaymentStatus(arg);

    // Start polling if payment is still pending
    if (result.isPending) {
      _startPolling(arg);
    }

    return result;
  }

  void _startPolling(int orderId) {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) async {
      try {
        final result =
            await ref.read(apiServiceProvider).getPaymentStatus(orderId);
        state = AsyncData(result);

        // Stop polling once payment reaches a terminal state
        // (completed, expired, or failed).
        if (result.isTerminal) {
          _timer?.cancel();
        }
      } catch (e) {
        // Don't update state on polling errors to keep showing last known state
      }
    });
  }

  /// Manually refresh the payment status.
  Future<void> refresh(int orderId) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref.read(apiServiceProvider).getPaymentStatus(orderId),
    );
  }
}

final paymentPollingProvider = AsyncNotifierProvider.autoDispose
    .family<PaymentPollingNotifier, PaymentStatusResult, int>(
  PaymentPollingNotifier.new,
);
