import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: methods.map((m) {
              final cs = Theme.of(context).colorScheme;
              final isDark = Theme.of(context).brightness == Brightness.dark;
              final selectedBg = isDark ? Color.alphaBlend(cs.primary.withValues(alpha: 0.16), cs.surface) : cs.primary.withValues(alpha: 0.10);
              final isSel = m.methodId == selected;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () {
                    HapticFeedback.selectionClick();
                    onChanged?.call(m);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOutCubic,
                    child: ChoiceChip(
                      label: Text(m.displayName),
                      selected: isSel,
                      selectedColor: selectedBg,
                      backgroundColor: cs.surface,
                      side: BorderSide(color: isSel ? cs.primary : cs.outlineVariant, width: isSel ? 2 : 1),
                      labelStyle: TextStyle(
                        color: isSel ? cs.onSurface : cs.onSurface.withValues(alpha: 0.90),
                        fontWeight: isSel ? FontWeight.w600 : FontWeight.w500,
                      ),
                      showCheckmark: false,
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
