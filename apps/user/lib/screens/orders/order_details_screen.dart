// lib/screens/orders/order_details_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/orders/order.dart';
import '../../models/orders/order_status.dart';
import '../../providers/order_details_provider.dart';
import 'widgets/driver_info_card.dart';
import 'widgets/failure_details_card.dart';
import 'widgets/order_summary_card.dart';
// import 'widgets/proof_of_delivery_card.dart';
import 'widgets/rating_card.dart';
// import 'widgets/refund_status_card.dart';
import 'widgets/route_details_card.dart';
import 'widgets/status_hero_card.dart';
import 'widgets/timeline_card.dart';

class OrderDetailsScreen extends ConsumerWidget {
  const OrderDetailsScreen({required this.orderId, super.key});

  final int orderId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final orderState = ref.watch(orderDetailsProvider(orderId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Order Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {
              // TODO: Show options menu
            },
          ),
        ],
      ),
      body: orderState.when(
        data: (order) => _buildOrderContent(context, ref, order),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => _buildErrorState(context, theme, error, ref),
      ),
    );
  }

  Widget _buildOrderContent(BuildContext context, WidgetRef ref, Order order) => RefreshIndicator(
    onRefresh: () => ref.read(orderDetailsProvider(orderId).notifier).refresh(),
    child: SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Hero Card
          StatusHeroCard(
            status: order.status,
            orderNumber: order.orderNumber,
            timestamp: order.statusTimestamp,
            etaText: _getEtaText(order),
            distanceText: _getDistanceText(order),
            reasonText: _getReasonText(order),
            onPrimaryAction: _getPrimaryAction(context, order),
            onSecondaryAction: _getSecondaryAction(context, order),
            primaryActionLabel: _getPrimaryActionLabel(order),
            secondaryActionLabel: _getSecondaryActionLabel(order),
            primaryActionIcon: _getPrimaryActionIcon(order),
            secondaryActionIcon: _getSecondaryActionIcon(order),
          ),
          const SizedBox(height: 16),

          // Status-specific widgets (maps, driver info, etc.)
          ..._buildStatusSpecificWidgets(order),

          // Timeline
          TimelineCard(
            status: order.status,
            orderPlacedAt: order.createdAt,
            driverAssignedAt: order.acceptedAt,
            pickedUpAt: order.pickedUpAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            // failedAt: order.failedAt, // TODO: Add when available
          ),
          const SizedBox(height: 16),

          // Route Details
          RouteDetailsCard(
            pickupAddress: order.pickupAddress,
            deliveryAddress: order.deliveryAddress,
            pickupContact: order.pickupContact,
            deliveryContact: order.deliveryContact,
          ),
          const SizedBox(height: 16),

          // Order Summary
          OrderSummaryCard(
            vehicleType: order.vehicleCategoryDisplay ?? 'Standard',
            packageType: order.packageType,
            deliveryType: order.deliveryTypeDisplay ?? 'Standard',
            distance: order.distance != null ? '${order.distance!.toStringAsFixed(1)} km' : null,
            weight: order.packageWeight != null ? '${order.packageWeight}' : null,
            order: order,
            fare: '₹${order.totalFare}',
          ),
          const SizedBox(height: 16),

          // Payment details
          _buildPaymentDetails(context, order),
        ],
      ),
    ),
  );

  String? _getEtaText(Order order) {
    switch (order.status) {
      case OrderStatus.pending:
        final elapsed = DateTime.now().difference(order.createdAt);
        return 'Placed ${elapsed.inMinutes} minutes ago';
      case OrderStatus.accepted:
        return 'Driver is on the way';
      case OrderStatus.pickedUp:
        return 'On the way to delivery';
      case OrderStatus.delivered:
        if (order.actualDurationMins != null) {
          return 'Total time: ${order.actualDurationMins} mins';
        }
        if (order.deliveredAt == null) {
          return null;
        }
        final duration = order.deliveredAt!.difference(order.createdAt);
        return 'Total time: ${duration.inMinutes} minutes';
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
      case OrderStatus.inTransit:
        return null;
    }
  }

  String? _getDistanceText(Order order) {
    if (order.distance != null) {
      return '${order.distance!.toStringAsFixed(1)} km total distance';
    }
    return null;
  }

  String? _getReasonText(Order order) {
    if (order.status == OrderStatus.cancelled) {
      return order.cancellationReason ?? 'Cancelled by user';
    } else if (order.status == OrderStatus.rejected) {
      return order.cancellationReason ?? 'Recipient unavailable';
    }
    return null;
  }

  VoidCallback? _getPrimaryAction(BuildContext context, Order order) {
    switch (order.status) {
      case OrderStatus.pending:
        return () {
          // TODO(arsh): Show cancel dialog
        };
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return () {
          // TODO(arsh): Navigate to live tracking
        };
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return () {
          // TODO(arsh): Navigate to reorder
        };
      case OrderStatus.inTransit:
        return null;
    }
  }

  VoidCallback? _getSecondaryAction(BuildContext context, Order order) {
    switch (order.status) {
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return () {
          // TODO(arsh): Call driver
        };
      case OrderStatus.delivered:
        return () {
          // TODO(arsh): Download invoice
        };
      case OrderStatus.pending:
      case OrderStatus.inTransit:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return null;
    }
  }

  String? _getPrimaryActionLabel(Order order) {
    switch (order.status) {
      case OrderStatus.pending:
        return 'Cancel Order';
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return 'Track Live';
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return 'Reorder';
      case OrderStatus.inTransit:
        return null;
    }
  }

  String? _getSecondaryActionLabel(Order order) {
    switch (order.status) {
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return 'Call Driver';
      case OrderStatus.delivered:
        return 'Download Invoice';
      case OrderStatus.pending:
      case OrderStatus.inTransit:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return null;
    }
  }

  IconData? _getPrimaryActionIcon(Order order) {
    switch (order.status) {
      case OrderStatus.pending:
        return Icons.cancel;
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return Icons.location_on;
      case OrderStatus.delivered:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return Icons.refresh;
      case OrderStatus.inTransit:
        return null;
    }
  }

  IconData? _getSecondaryActionIcon(Order order) {
    switch (order.status) {
      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
        return Icons.phone;
      case OrderStatus.delivered:
        return Icons.download;
      case OrderStatus.pending:
      case OrderStatus.inTransit:
      case OrderStatus.cancelled:
      case OrderStatus.undeliverable:
      case OrderStatus.returned:
      case OrderStatus.rejected:
        return null;
    }
  }

  Widget _buildPaymentDetails(BuildContext context, Order order) {
    final theme = Theme.of(context);
    final payment = order.payment;
    final fareBreakdown = payment?.fareBreakdown;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: theme.colorScheme.outlineVariant),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Payment Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          if (fareBreakdown != null) ...[
            _PaymentRow(label: 'Base Fare', value: '₹${fareBreakdown.basePrice}'),
            const SizedBox(height: 8),
            _PaymentRow(label: 'Distance Charge', value: '₹${fareBreakdown.distancePrice}'),
            const SizedBox(height: 8),
            if (fareBreakdown.weightSurcharge > 0) ...[
              _PaymentRow(label: 'Weight Surcharge', value: '₹${fareBreakdown.weightSurcharge}'),
              const SizedBox(height: 8),
            ],
            if (fareBreakdown.platformFee > 0) ...[
              _PaymentRow(label: 'Platform Fee', value: '₹${fareBreakdown.platformFee}'),
              const SizedBox(height: 8),
            ],
            if (fareBreakdown.gstAmount > 0) ...[_PaymentRow(label: 'GST', value: '₹${fareBreakdown.gstAmount}'), const Divider(height: 24)],
            _PaymentRow(label: 'Total', value: '₹${fareBreakdown.totalPrice}', isTotal: true),
          ] else ...[
            // Fallback to order fields if fareBreakdown is not available
            ...[_PaymentRow(label: 'Base Fare', value: '₹${order.fareBreakdown.basePrice}'), const SizedBox(height: 8)],
            ...[_PaymentRow(label: 'Distance Charge', value: '₹${order.fareBreakdown.distancePrice}'), const SizedBox(height: 8)],
            if (order.fareBreakdown.weightSurcharge > 0) ...[
              _PaymentRow(label: 'Weight Surcharge', value: '₹${order.fareBreakdown.weightSurcharge}'),
              const SizedBox(height: 8),
            ],
            if (order.fareBreakdown.platformFee > 0) ...[
              _PaymentRow(label: 'Platform Fee', value: '₹${order.fareBreakdown.platformFee}'),
              const SizedBox(height: 8),
            ],
            if (order.fareBreakdown.gstAmount > 0) ...[
              _PaymentRow(label: 'GST', value: '₹${order.fareBreakdown.gstAmount}'),
              const Divider(height: 24),
            ],
            _PaymentRow(label: 'Total', value: '₹${order.totalFare}', isTotal: true),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.check_circle, size: 16, color: Colors.green),
              const SizedBox(width: 8),
              Text(
                'Paid via ${payment?.paymentMethod ?? 'UPI'}',
                style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<Widget> _buildStatusSpecificWidgets(Order order) {
    final widgets = <Widget>[];

    // Status-specific components
    switch (order.status) {
      case OrderStatus.pending:
        // No specific widgets for pending yet
        break;

      case OrderStatus.accepted:
      case OrderStatus.pickedUp:
      case OrderStatus.inTransit:
        if (order.courier != null) {
          widgets.add(DriverInfoCard(courier: order.courier!));
          widgets.add(const SizedBox(height: 16));
        }
        // TODO(arsh): Add LiveMapCard (pickedUp only)
        break;

      case OrderStatus.delivered:
        if (order.courier != null) {
          widgets.add(DriverInfoCard(courier: order.courier!));
          widgets.add(const SizedBox(height: 16));
        }
        widgets.add(const RatingCard());
        widgets.add(const SizedBox(height: 16));
        // TODO: Add ProofOfDeliveryCard when API supports it
        // widgets.add(ProofOfDeliveryCard(imageUrl: order.proofUrl, signatureUrl: order.signatureUrl));
        break;

      case OrderStatus.cancelled:
      case OrderStatus.returned:
        // TODO: Add RefundStatusCard when API supports it
        // widgets.add(RefundStatusCard(amount: order.totalFare, status: 'Processed'));
        break;

      case OrderStatus.undeliverable:
      case OrderStatus.rejected:
        widgets.add(
          FailureDetailsCard(
            reason: order.cancellationReason ?? 'Delivery attempt failed',
            // driverNotes: order.driverNotes, // TODO: Add to model
          ),
        );
        widgets.add(const SizedBox(height: 16));
        // widgets.add(RefundStatusCard(amount: order.totalFare - 50, status: 'Pending'));
        break;
    }

    return widgets;
  }

  Widget _buildErrorState(BuildContext context, ThemeData theme, Object error, WidgetRef ref) => Center(
    child: Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: theme.colorScheme.error),
          const SizedBox(height: 16),
          Text('Failed to load order', style: theme.textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(error.toString(), style: theme.textTheme.bodySmall, textAlign: TextAlign.center),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: () => ref.read(orderDetailsProvider(orderId).notifier).refresh(),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    ),
  );
}

class _PaymentRow extends StatelessWidget {
  const _PaymentRow({required this.label, required this.value, this.isTotal = false});

  final String label;
  final String value;
  final bool isTotal;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final style = isTotal
        ? theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)
        : theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.7));

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: style),
        Text(value, style: style),
      ],
    );
  }
}
