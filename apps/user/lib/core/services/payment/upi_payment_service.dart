import 'package:flutter/material.dart';
import 'package:upi_india/upi_india.dart';

/// Service class for handling UPI payments in the Shipzy application.
///
/// This service provides functionality to:
/// - Get available UPI applications on the device
/// - Initiate UPI payments with specified parameters
/// - Handle payment responses and errors
class UpiPaymentService {
  final UpiIndia _upiIndia = UpiIndia();

  /// Gets all available UPI applications installed on the device.
  ///
  /// Returns a list of [UpiApp] objects representing available UPI apps.
  /// Returns an empty list if an error occurs or no apps are found.
  Future<List<UpiApp>> getAvailableUpiApps() async {
    try {
      return await _upiIndia.getAllUpiApps(mandatoryTransactionId: false);
    } catch (e) {
      debugPrint('Error getting UPI apps: $e');
      return [];
    }
  }

  /// Initiates a UPI payment transaction.
  ///
  /// [receiverUpiId] - The UPI ID of the payment receiver
  /// [receiverName] - The name of the payment receiver
  /// [amount] - The amount to be paid
  /// [transactionRef] - Unique transaction reference ID
  /// [app] - The UPI app to use for the transaction
  /// [transactionNote] - Optional note for the transaction
  ///
  /// Returns a [UpiResponse] containing the result of the payment attempt.
  Future<UpiResponse> initiatePayment({
    required String receiverUpiId,
    required String receiverName,
    required double amount,
    required String transactionRef,
    required UpiApp app,
    String? transactionNote,
  }) async {
    try {
      final response = await _upiIndia.startTransaction(
        app: app,
        receiverUpiId: receiverUpiId,
        receiverName: receiverName,
        transactionRefId: transactionRef,
        transactionNote: transactionNote ?? 'Shipzy Order Payment',
        amount: amount,
      );

      return response;
    } catch (e) {
      debugPrint('Error initiating UPI payment: $e');
      rethrow;
    }
  }

  // Check payment status
  PaymentStatus checkPaymentStatus(UpiResponse response) {
    switch (response.status) {
      case UpiPaymentStatus.SUCCESS:
        return PaymentStatus.success;
      case UpiPaymentStatus.SUBMITTED:
        return PaymentStatus.pending;
      case UpiPaymentStatus.FAILURE:
        return PaymentStatus.failed;
      default:
        return PaymentStatus.failed;
    }
  }
}

enum PaymentStatus { success, pending, failed, cancelled }
