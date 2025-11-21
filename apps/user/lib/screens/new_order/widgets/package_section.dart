import 'package:flutter/material.dart';
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
        TextField(
          controller: _weight,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          decoration: const InputDecoration(prefixIcon: Icon(Icons.scale_outlined), hintText: 'Weight (kg)'),
          onChanged: (v) {
            final w = double.tryParse(v);
            if (w != null) widget.onWeightChanged(w);
          },
        ),
        const SizedBox(height: 12),
        // Categories
        Text('What are you sending?', style: Theme.of(context).textTheme.bodyLarge),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: packages.map((p) {
            final isSel = p.packageTypeId == selected;
            return ChoiceChip(
              label: Text(p.name),
              selected: isSel,
              onSelected: (_) => widget.onCategoryChanged(p),
              selectedColor: Theme.of(context).colorScheme.primary.withValues(alpha: 0.18),
            );
          }).toList(),
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
            if (d != null) widget.onDeclaredValueChanged(d);
          },
        ),
        const SizedBox(height: 6),
        Text('We compensate declared value for verified loss/damage; fee is policy-based.', style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}
