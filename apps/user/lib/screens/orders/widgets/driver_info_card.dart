// lib/screens/order_details/widgets/driver_info_card.dart

import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/orders/order.dart';

class DriverInfoCard extends StatelessWidget {
  const DriverInfoCard({required this.courier, super.key});

  final OrderCourier courier;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

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
          Text('Driver Details', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Row(
            children: [
              // Driver Photo
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.primaryContainer,
                  image: courier.profilePictureUrl != null
                      ? DecorationImage(image: NetworkImage(courier.profilePictureUrl!), fit: BoxFit.cover)
                      : null,
                ),
                child: courier.profilePictureUrl == null ? Icon(Icons.person, color: theme.colorScheme.onPrimaryContainer) : null,
              ),
              const SizedBox(width: 16),

              // Driver Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(courier.name ?? 'Unknown Driver', style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 14, color: Colors.amber),
                        const SizedBox(width: 4),
                        Text(
                          '4.8', // TODO: Add rating to API/Model
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          '• 150+ deliveries', // TODO: Add delivery count to API/Model
                          style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurface.withValues(alpha: 0.6)),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Call Button
              IconButton.filledTonal(onPressed: () => _makePhoneCall(courier.phone), icon: const Icon(Icons.phone)),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _makePhoneCall(String phoneNumber) async {
    final launchUri = Uri(scheme: 'tel', path: phoneNumber);
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }
}
