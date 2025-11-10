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
          mainAxisSize: MainAxisSize.min,
          children: [
            // Top row: icon + labels (single line)
            Row(
              children: [
                _TypeIcon(deliveryType: deliveryType),
                const SizedBox(width: 8),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, c) {
                      final labels = deliveryType.labels.cast<Label>();
                      final visible = labels.take(2).toList();
                      final overflow = labels.length - visible.length;
                      return Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: [...visible.map(_LabelPill.fromLabel), if (overflow > 0) _LabelPill.plusN(overflow)],
                      );
                    },
                  ),
                ),
              ],
            ),
            // Bottom: name + price
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
                  'from ₹${deliveryType.baseRate.toStringAsFixed(1)}',
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

/// Modern label pills (keeps your previous swatch logic) with a +n overflow.
class _LabelPill extends StatelessWidget {
  factory _LabelPill.fromLabel(Label label) {
    final name = label.displayText;
    final swatch = _labelSwatch(label);
    return _LabelPill._(
      Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (swatch.$3 != null) ...[Icon(swatch.$3, color: swatch.$2, size: 12), const SizedBox(width: 4)],
          Text(
            name,
            style: TextStyle(color: swatch.$2, fontWeight: FontWeight.w700, fontSize: 11, height: 1.1),
          ),
        ],
      ),
      swatch.$1,
      swatch.$2,
    );
  }

  factory _LabelPill.plusN(int n) {
    const fg = Color(0xFF9CA3AF);
    return _LabelPill._(
      Text(
        '+$n',
        style: const TextStyle(color: fg, fontWeight: FontWeight.w700, fontSize: 11),
      ),
      Colors.grey.withValues(alpha: 0.16),
      fg,
    );
  }
  const _LabelPill._(this.child, this.bg, this.fg);
  final Widget child;
  final Color bg;
  final Color fg;

  static (Color, Color, IconData?) _labelSwatch(Label label) {
    // Parse hex colors from API
    final bgColor = _hexToColor(label.backgroundColor);
    final textColor = _hexToColor(label.color);

    // Apply alpha to background for modern look
    final alpha = label.name.toLowerCase().contains('discount') ? 0.18 : 0.20;
    final backgroundColor = bgColor.withValues(alpha: alpha);

    // Determine icon based on label name
    final kind = label.name.toLowerCase();
    final text = label.displayText.toLowerCase();
    IconData? icon;
    if (kind.contains('new')) {
      icon = Icons.fiber_new_rounded;
    } else if (kind.contains('fast') || text.contains('fast')) {
      icon = Icons.bolt_rounded;
    } else if (kind.contains('discount') || label.displayText.contains('%')) {
      icon = Icons.local_offer_rounded;
    } else if (kind.contains('eco')) {
      icon = Icons.eco_rounded;
    } else {
      icon = Icons.info_outline_rounded;
    }

    return (backgroundColor, textColor, icon);
  }

  static Color _hexToColor(String hex) {
    final hexColor = hex.replaceAll('#', '');
    return Color(int.parse('FF$hexColor', radix: 16));
  }

  @override
  Widget build(BuildContext context) => Container(
    height: 22,
    padding: const EdgeInsets.symmetric(horizontal: 8),
    decoration: BoxDecoration(
      color: bg,
      borderRadius: BorderRadius.circular(24),
      border: Border.all(color: fg.withValues(alpha: 0.35)),
    ),
    child: child,
  );
}
