// lib/screens/order_details/widgets/proof_of_delivery_card.dart

import 'package:flutter/material.dart';

class ProofOfDeliveryCard extends StatelessWidget {
  const ProofOfDeliveryCard({this.imageUrl, this.signatureUrl, super.key});

  final String? imageUrl;
  final String? signatureUrl;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (imageUrl == null && signatureUrl == null) return const SizedBox.shrink();

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
          Text('Proof of Delivery', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          if (imageUrl != null) ...[
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                imageUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) => Container(
                  height: 200,
                  color: theme.colorScheme.surfaceContainerHighest,
                  child: const Center(child: Icon(Icons.broken_image)),
                ),
              ),
            ),
          ],
          if (signatureUrl != null) ...[
            const SizedBox(height: 16),
            Text('Signature', style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Container(
              height: 100,
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: theme.colorScheme.outlineVariant),
              ),
              child: Image.network(signatureUrl!, fit: BoxFit.contain),
            ),
          ],
        ],
      ),
    );
  }
}
