import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/order_provider.dart';
import '../../utils/app_routes.dart';
import '../../widgets/map_widget.dart';

class OrderDetailsScreen extends ConsumerStatefulWidget {
  const OrderDetailsScreen({required this.orderId, super.key});
  final String orderId;

  @override
  ConsumerState<OrderDetailsScreen> createState() => _OrderDetailsScreenState();
}

class _OrderDetailsScreenState extends ConsumerState<OrderDetailsScreen> {
  bool _isLoading = false;

  Future<void> _acceptOrder() async {
    setState(() => _isLoading = true);
    try {
      await ref.read(orderProvider.notifier).acceptOrder(widget.orderId);
      if (mounted) {
        context.go(AppRoutes.activeDeliveryPath(widget.orderId));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to accept order: ${e.toString()}')));
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Order Details')),
    body: Column(
      children: [
        const SizedBox(height: 250, child: MapWidget()),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Order #${widget.orderId}', style: Theme.of(context).textTheme.headlineSmall),
                    Text(
                      '\$15.00',
                      style: Theme.of(
                        context,
                      ).textTheme.headlineSmall?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildLocationRow(Icons.my_location, 'Pickup', '123 Main St, New York, NY'),
                const SizedBox(height: 16),
                _buildLocationRow(Icons.location_on, 'Dropoff', '456 Elm St, Brooklyn, NY'),
                const Spacer(),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(onPressed: () => context.pop(), child: const Text('Reject')),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _acceptOrder,
                        child: _isLoading ? const CircularProgressIndicator() : const Text('Accept Order'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    ),
  );

  Widget _buildLocationRow(IconData icon, String label, String address) => Row(
    children: [
      Icon(icon, color: Theme.of(context).colorScheme.primary),
      const SizedBox(width: 16),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Text(address, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    ],
  );
}
