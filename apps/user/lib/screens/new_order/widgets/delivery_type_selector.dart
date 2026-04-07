import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/orders/create_order_data.dart';
import '../../../providers/new_order_provider.dart';

class DeliveryTypeSelector extends ConsumerWidget {
  const DeliveryTypeSelector({this.onChanged, super.key});
  final void Function(DeliveryType)? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(newOrderProvider);
    final types = state.createOrderData?.deliveryTypes ?? const <DeliveryType>[];
    final selectedId = state.selectedDeliveryType?.deliveryTypeId;

    const itemWidth = 188.0;
    const itemHeight = 100.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Delivery type', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        SizedBox(
          height: itemHeight,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 2),
            scrollDirection: Axis.horizontal,
            itemCount: types.length,
            separatorBuilder: (_, _) => const SizedBox(width: 12),
            itemBuilder: (context, i) {
              final dt = types[i];
              final selected = dt.deliveryTypeId == selectedId;
              return _DeliveryTypeTile(
                deliveryType: dt,
                selected: selected,
                width: itemWidth,
                onTap: () {
                  HapticFeedback.selectionClick();
                  onChanged?.call(dt);
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _DeliveryTypeTile extends StatelessWidget {
  const _DeliveryTypeTile({required this.deliveryType, required this.selected, required this.onTap, required this.width});

  final DeliveryType deliveryType;
  final bool selected;
  final VoidCallback onTap;
  final double width;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedFill = isDark ? Color.alphaBlend(cs.primary.withValues(alpha: 0.16), cs.surface) : cs.primary.withValues(alpha: 0.06);

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        curve: Curves.easeOutCubic,
        width: width,
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: selected ? selectedFill : cs.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: selected ? cs.primary : cs.outlineVariant, width: selected ? 2 : 1),
          boxShadow: selected
              ? [BoxShadow(color: cs.primary.withValues(alpha: 0.18), blurRadius: 14, offset: const Offset(0, 6))]
              : [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, 3))],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _TypeIcon(deliveryType: deliveryType),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  deliveryType.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                ),
                Text(
                  'from ₹${deliveryType.pricing.baseRate.toStringAsFixed(1)}',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.primary, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TypeIcon extends StatelessWidget {
  const _TypeIcon({required this.deliveryType});
  final DeliveryType deliveryType;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final iconData = _iconForType(deliveryType);
    return Container(
      width: 32,
      height: 32,
      decoration: BoxDecoration(
        color: cs.primary.withValues(alpha: 0.10),
        shape: BoxShape.circle,
        border: Border.all(color: cs.primary.withValues(alpha: 0.22)),
      ),
      alignment: Alignment.center,
      child: Icon(iconData, size: 18, color: cs.primary),
    );
  }

  static IconData _iconForType(DeliveryType dt) {
    final key = '${dt.name} ${dt.displayName}'.toLowerCase();
    if (key.contains('now') || key.contains('express') || key.contains('instant')) {
      return Icons.bolt_rounded;
    }
    if (key.contains('schedule') || key.contains('scheduled')) {
      return Icons.schedule_rounded;
    }
    if (key.contains('day') || key.contains('today') || key.contains('by end')) {
      return Icons.event_available_rounded;
    }
    if (key.contains('truck') || key.contains('freight')) {
      return Icons.local_shipping_rounded;
    }
    return Icons.local_mall_rounded;
  }
}
