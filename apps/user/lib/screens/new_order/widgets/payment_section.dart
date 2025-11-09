import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/orders/create_order_data.dart';
import '../../../providers/new_order_provider.dart';

class PaymentSection extends ConsumerWidget {
  const PaymentSection({super.key, this.onChanged});

  final void Function(PaymentMethod)? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(newOrderProvider);
    final methods = state.createOrderData?.paymentMethods ?? [];
    final selected = state.selectedPaymentMethod?.methodId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Payment', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: methods.map((m) {
            final isSel = m.methodId == selected;
            return ChoiceChip(
              label: Text(m.displayName),
              selected: isSel,
              onSelected: (_) => onChanged?.call(m),
              selectedColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.18),
            );
          }).toList(),
        ),
      ],
    );
  }
}
