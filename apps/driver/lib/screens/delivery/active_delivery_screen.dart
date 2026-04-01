import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/order_provider.dart';
import '../../widgets/map_widget.dart';

class ActiveDeliveryScreen extends ConsumerStatefulWidget {
  const ActiveDeliveryScreen({required this.orderId, super.key});

  final String orderId;

  @override
  ConsumerState<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends ConsumerState<ActiveDeliveryScreen> {
  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Delivery'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            // Prevent accidental exit during active delivery
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Cancel Delivery?'),
                content: const Text('Are you sure you want to cancel this delivery? This may affect your rating.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('No')),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.go('/home');
                    },
                    child: const Text('Yes, Cancel'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Column(
        children: [
          const Expanded(child: MapWidget()),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_getStatusText(orderState.status), style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 16),
                ListTile(
                  leading: const CircleAvatar(child: Icon(Icons.person)),
                  title: const Text('Customer Name'),
                  subtitle: const Text('+1 234 567 8900'),
                  trailing: IconButton(icon: const Icon(Icons.call), onPressed: () {}),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => _handleAction(orderState.status),
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
                  child: Text(_getActionText(orderState.status)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getStatusText(OrderStatus status) {
    switch (status) {
      case OrderStatus.idle:
        return 'Unknown Status';
      case OrderStatus.accepted:
        return 'Head to Pickup';
      case OrderStatus.navigatingToPickup:
        return 'Navigating to Pickup';
      case OrderStatus.arrivedAtPickup:
        return 'Arrived at Pickup';
      case OrderStatus.pickedUp:
        return 'Head to Dropoff';
      case OrderStatus.navigatingToDropoff:
        return 'Navigating to Dropoff';
      case OrderStatus.arrivedAtDropoff:
        return 'Arrived at Dropoff';
      case OrderStatus.completed:
        return 'Delivery Completed';
    }
  }

  String _getActionText(OrderStatus status) {
    switch (status) {
      case OrderStatus.idle:
        return 'Continue';
      case OrderStatus.accepted:
        return 'Start Navigation';
      case OrderStatus.navigatingToPickup:
        return 'Arrived at Pickup';
      case OrderStatus.arrivedAtPickup:
        return 'Confirm Pickup';
      case OrderStatus.pickedUp:
        return 'Start Navigation';
      case OrderStatus.navigatingToDropoff:
        return 'Arrived at Dropoff';
      case OrderStatus.arrivedAtDropoff:
        return 'Complete Delivery';
      case OrderStatus.completed:
        return 'Continue';
    }
  }

  void _handleAction(OrderStatus status) {
    final notifier = ref.read(orderProvider.notifier);
    switch (status) {
      case OrderStatus.idle:
        break;
      case OrderStatus.accepted:
        notifier.startNavigation(widget.orderId);
        break;
      case OrderStatus.navigatingToPickup:
        // Update status to arrived
        break;
      case OrderStatus.arrivedAtPickup:
        notifier.confirmPickup(widget.orderId);
        break;
      case OrderStatus.pickedUp:
        // Start nav to dropoff
        break;
      case OrderStatus.navigatingToDropoff:
        // Navigate to dropoff
        break;
      case OrderStatus.arrivedAtDropoff:
        notifier.completeDelivery(widget.orderId);
        context.go('/home');
        break;
      case OrderStatus.completed:
        break;
    }
  }
}
