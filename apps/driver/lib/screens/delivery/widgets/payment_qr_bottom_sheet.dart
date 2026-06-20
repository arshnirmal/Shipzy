import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/payment_models.dart';
import '../../../providers/payment_provider.dart';

class PaymentQRBottomSheet extends ConsumerWidget {
  const PaymentQRBottomSheet({
    required this.orderId,
    required this.onPaymentComplete,
    super.key,
  });

  final int orderId;
  final VoidCallback onPaymentComplete;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Generate/fetch the QR code
    final qrAsync = ref.watch(collectionQRProvider(orderId));
    // Poll the payment status
    final pollingAsync = ref.watch(paymentPollingProvider(orderId));

    // If payment becomes completed while we are viewing this sheet, trigger the callback
    ref.listen<AsyncValue<PaymentStatusResult>>(
      paymentPollingProvider(orderId),
      (previous, next) {
        if (next.valueOrNull?.isPaid == true) {
          onPaymentComplete();
        }
      },
    );

    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).padding.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Collect Payment',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              IconButton(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.close),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            'Ask the customer to scan this QR code using any UPI app.',
          ),
          const SizedBox(height: 24),
          qrAsync.when(
            loading: () => const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: CircularProgressIndicator(),
              ),
            ),
            error: (err, stack) => Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 48),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to generate QR code',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      err.toString(),
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    OutlinedButton(
                      onPressed: () => ref.invalidate(collectionQRProvider(orderId)),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
            data: (qrData) => Column(
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Image.network(
                    qrData.imageUrl,
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(
                      width: 200,
                      height: 200,
                      child: Center(
                        child: Icon(Icons.broken_image, size: 48, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  '₹${qrData.amount.toStringAsFixed(2)}',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                const SizedBox(height: 16),
                pollingAsync.when(
                  loading: () => const SizedBox(),
                  error: (err, stack) => const Text('Error checking payment status'),
                  data: (statusData) {
                    if (statusData.isPaid) {
                      return const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.check_circle, color: Colors.green),
                          SizedBox(width: 8),
                          Text(
                            'Payment Received!',
                            style: TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      );
                    }
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'Waiting for payment...',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: Colors.grey[600],
                              ),
                        ),
                      ],
                    );
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              ref.read(paymentPollingProvider(orderId).notifier).refresh(orderId);
            },
            child: const Text('Refresh Status'),
          ),
        ],
      ),
    );
  }
}

/// Helper method to show the QR bottom sheet
Future<void> showPaymentQRBottomSheet({
  required BuildContext context,
  required int orderId,
  required VoidCallback onPaymentComplete,
}) async {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => PaymentQRBottomSheet(
      orderId: orderId,
      onPaymentComplete: onPaymentComplete,
    ),
  );
}
