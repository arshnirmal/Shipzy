import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../models/orders/create_order_data.dart';
import '../../../providers/new_order_provider.dart';

class PackageSection extends ConsumerStatefulWidget {
  const PackageSection({
    required this.onWeightChanged,
    required this.onCategoryChanged,
    required this.onDescriptionChanged,
    required this.onDeclaredValueChanged,
    super.key,
  });

  final void Function(double) onWeightChanged;
  final void Function(PackageType) onCategoryChanged;
  final void Function(String) onDescriptionChanged;
  final void Function(double) onDeclaredValueChanged;

  @override
  ConsumerState<PackageSection> createState() => _PackageSectionState();
}

class _PackageSectionState extends ConsumerState<PackageSection> {
  final _weight = TextEditingController();
  final _desc = TextEditingController();
  final _declared = TextEditingController();

  @override
  void dispose() {
    _weight.dispose();
    _desc.dispose();
    _declared.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(newOrderProvider);
    final packages = state.createOrderData?.packageTypes ?? [];
    final selected = state.selectedPackageType?.packageTypeId;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Package', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        // Weight
        DropdownButtonFormField<double>(
          initialValue: state.packageWeight,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.scale_outlined), hintText: 'Select Weight'),
          items:
              state.selectedVehicle?.weightTiers
                  .map((tier) => DropdownMenuItem<double>(value: tier.maxWeightKg, child: Text('Up to ${tier.maxWeightKg} kg')))
                  .toList() ??
              [],
          onChanged: (v) {
            if (v != null) {
              widget.onWeightChanged(v);
            }
          },
        ),
        const SizedBox(height: 12),
        // Categories
        Text('What are you sending?', style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: packages.map((p) {
              final cs = Theme.of(context).colorScheme;
              final isDark = Theme.of(context).brightness == Brightness.dark;
              final selectedBg = isDark ? Color.alphaBlend(cs.primary.withValues(alpha: 0.16), cs.surface) : cs.primary.withValues(alpha: 0.10);
              final isSel = p.packageTypeId == selected;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: InkWell(
                  borderRadius: BorderRadius.circular(20),
                  onTap: () {
                    HapticFeedback.selectionClick();
                    widget.onCategoryChanged(p);
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOutCubic,
                    child: ChoiceChip(
                      label: Text(p.name),
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
        const SizedBox(height: 12),
        // Description
        TextField(
          controller: _desc,
          maxLines: 2,
          decoration: const InputDecoration(prefixIcon: Icon(Icons.notes_outlined), hintText: 'Instruction for the courier / description'),
          onChanged: widget.onDescriptionChanged,
        ),
        const SizedBox(height: 12),
        // Declared value (optional)
        TextField(
          controller: _declared,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(prefixIcon: Icon(Icons.verified_outlined), hintText: 'Parcel value (optional)'),
          onChanged: (v) {
            final d = double.tryParse(v);
            if (d != null) {
              widget.onDeclaredValueChanged(d);
            }
          },
        ),
        const SizedBox(height: 6),
        Text('We compensate declared value for verified loss/damage; fee is policy-based.', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
