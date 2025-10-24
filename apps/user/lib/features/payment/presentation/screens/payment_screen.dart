import 'package:flutter/material.dart';

/// Screen for handling payment processing.
///
/// Displays payment options and handles payment completion for orders.
/// [orderId] - The ID of the order being paid for
/// [amount] - The amount to be paid
class PaymentScreen extends StatelessWidget {
  /// Creates a [PaymentScreen].
  ///
  /// [orderId] - The ID of the order being paid for
  /// [amount] - The amount to be paid
  const PaymentScreen({super.key, this.orderId, this.amount});

  /// The ID of the order being paid for.
  final String? orderId;

  /// The amount to be paid.
  final double? amount;

  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Payment Screen - Order: ${orderId ?? 'N/A'}, Amount: ${amount ?? 0}')));
}
