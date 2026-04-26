import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/orders/create_order_data.dart';
import '../../../providers/new_order_provider.dart';

class VehicleSelector extends ConsumerWidget {
  const VehicleSelector({super.key, this.onChanged});

  final void Function(Vehicle)? onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(newOrderProvider);
    final vehicles = state.selectedDeliveryType?.supportedVehicles ?? [];
    final selected = state.selectedVehicle?.categoryId;

    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedBg = isDark ? Color.alphaBlend(cs.primary.withValues(alpha: 0.16), cs.surface) : cs.primary.withValues(alpha: 0.10);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Vehicle', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: vehicles.map((v) {
            final isSel = v.categoryId == selected;
            return ChoiceChip(
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(v.displayName ?? v.name),
                  const SizedBox(width: 6),
                  Text('• up to ${v.maxWeightKg.toStringAsFixed(0)} kg', style: const TextStyle(fontSize: 12)),
                ],
              ),
              selected: isSel,
              onSelected: (_) => onChanged?.call(v),
              selectedColor: selectedBg,
              backgroundColor: cs.surface,
              side: BorderSide(color: isSel ? cs.primary : cs.outlineVariant, width: isSel ? 2 : 1),
              labelStyle: TextStyle(
                color: isSel ? cs.onSurface : cs.onSurface.withValues(alpha: 0.90),
                fontWeight: isSel ? FontWeight.w600 : FontWeight.w500,
              ),
              avatar: Icon(_getVehicleIcon(v.name), size: 16, color: cs.primary),
              showCheckmark: false,
            );
          }).toList(),
        ),
      ],
    );
  }

  IconData _getVehicleIcon(String vehicleName) {
    switch (vehicleName) {
      case '2_wheeler':
        return Icons.two_wheeler;
      case '3_wheeler':
        return Icons.electric_rickshaw;
      case 'mini_truck':
        return Icons.local_shipping;
      case 'truck':
        return Icons.fire_truck;
      default:
        return Icons.directions_car;
    }
  }
}
