import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../providers/new_order_provider.dart';
import '../../../utils/app_routes.dart';

typedef AddressChanged =
    void Function(
      String address,
      String baseAddress,
      double latitude,
      double longitude,
      String contactName,
      String contactPhone,
      String? building,
      String? floor,
      String? flat,
      String? howToReach,
    );
typedef ContactChanged = void Function(String name, String phone);

class LocationSection extends ConsumerStatefulWidget {
  const LocationSection({
    required this.onPickupChanged,
    required this.onDeliveryChanged,
    required this.onPickupContactChanged,
    required this.onDeliveryContactChanged,
    super.key,
  });

  final AddressChanged onPickupChanged;
  final AddressChanged onDeliveryChanged;
  final ContactChanged onPickupContactChanged;
  final ContactChanged onDeliveryContactChanged;

  @override
  ConsumerState<LocationSection> createState() => _LocationSectionState();
}

class _LocationSectionState extends ConsumerState<LocationSection> {
  final _pickAddr = TextEditingController();
  final _pickName = TextEditingController();
  final _pickPhone = TextEditingController();
  final _delAddr = TextEditingController();
  final _delName = TextEditingController();
  final _delPhone = TextEditingController();

  @override
  void dispose() {
    _pickAddr.dispose();
    _pickName.dispose();
    _pickPhone.dispose();
    _delAddr.dispose();
    _delName.dispose();
    _delPhone.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const StepRailHeader(step: 1, title: 'Pickup point'),
      const SizedBox(height: 8),
      ShipzyAddressField(
        controller: _pickAddr,
        hint: 'Pickup address',
        onPick: () async => _openPicker(context, purpose: 'pickup'),
      ),
      const SizedBox(height: 8),
      const SizedBox(height: 8),
      _namePhoneRow(_pickName, _pickPhone, () => widget.onPickupContactChanged(_pickName.text, _pickPhone.text)),
      const SizedBox(height: 18),
      const StepRailHeader(step: 2, title: 'Delivery point'),
      const SizedBox(height: 8),
      ShipzyAddressField(
        controller: _delAddr,
        hint: 'Delivery address',
        onPick: () async => _openPicker(context, purpose: 'delivery'),
      ),
      const SizedBox(height: 8),
      _namePhoneRow(_delName, _delPhone, () => widget.onDeliveryContactChanged(_delName.text, _delPhone.text)),
    ],
  );

  Future<void> _openPicker(BuildContext context, {required String purpose}) async {
    final state = ref.read(newOrderProvider);
    final extra = {
      'purpose': purpose,
      'initialAddress': (purpose == 'pickup') ? state.pickupBaseAddress : state.deliveryBaseAddress,
      'latitude': (purpose == 'pickup') ? state.pickupLatitude : state.deliveryLatitude,
      'longitude': (purpose == 'pickup') ? state.pickupLongitude : state.deliveryLongitude,
      'building': (purpose == 'pickup') ? state.pickupBuilding : state.deliveryBuilding,
      'floor': (purpose == 'pickup') ? state.pickupFloor : state.deliveryFloor,
      'flat': (purpose == 'pickup') ? state.pickupFlat : state.deliveryFlat,
      'howToReach': (purpose == 'pickup') ? state.pickupHowToReach : state.deliveryHowToReach,
    };

    final result = await context.push(AppRoutes.addressForm, extra: extra);
    if (!mounted || result == null) {
      return;
    }
    final sel = result as SelectedAddress;
    final formattedAddress = _formatAddress(sel);

    if (purpose == 'pickup') {
      _pickAddr.text = formattedAddress;
      widget.onPickupChanged(
        formattedAddress,
        sel.fullAddress,
        sel.latitude,
        sel.longitude,
        _pickName.text,
        _pickPhone.text,
        sel.building,
        sel.floor,
        sel.flat,
        sel.howToReach,
      );
    } else {
      _delAddr.text = formattedAddress;
      widget.onDeliveryChanged(
        formattedAddress,
        sel.fullAddress,
        sel.latitude,
        sel.longitude,
        _delName.text,
        _delPhone.text,
        sel.building,
        sel.floor,
        sel.flat,
        sel.howToReach,
      );
    }
  }

  /// Formats address as: Flat, Floor, Building, Searched Address (skipping empty fields)
  String _formatAddress(SelectedAddress sel) {
    final parts = <String>[];

    if (sel.flat != null && sel.flat!.trim().isNotEmpty) {
      parts.add(sel.flat!.trim());
    }
    if (sel.floor != null && sel.floor!.trim().isNotEmpty) {
      parts.add(sel.floor!.trim());
    }
    if (sel.building != null && sel.building!.trim().isNotEmpty) {
      parts.add(sel.building!.trim());
    }

    // Add the main address
    parts.add(sel.fullAddress);

    return parts.join(', ');
  }
}

Widget _namePhoneRow(TextEditingController name, TextEditingController phone, VoidCallback onChanged) => Row(
  children: [
    Expanded(
      child: TextField(
        controller: name,
        decoration: const InputDecoration(hintText: 'Contact name', prefixIcon: Icon(Icons.person_outline)),
        onChanged: (_) => onChanged(),
      ),
    ),
    const SizedBox(width: 10),
    Expanded(
      child: TextField(
        controller: phone,
        keyboardType: TextInputType.phone,
        maxLength: 10,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: const InputDecoration(hintText: 'Phone number', prefixIcon: Icon(Icons.call_outlined), counterText: ''),
        onChanged: (_) => onChanged(),
      ),
    ),
  ],
);

// Fancy step header with a vertical rail

class StepRailHeader extends StatelessWidget {
  const StepRailHeader({required this.step, required this.title, super.key});

  final int step;
  final String title;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Row(
      children: [
        Column(
          children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: cs.primary.withValues(alpha: 0.20),
              child: Text(
                '$step',
                style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700),
              ),
            ),
            Container(
              width: 2,
              height: 24,
              margin: const EdgeInsets.only(top: 4),
              decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)),
            ),
          ],
        ),
        const SizedBox(width: 10),
        Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// ReadOnly address field that routes to picker on tap or on suffix icon

class ShipzyAddressField extends StatelessWidget {
  const ShipzyAddressField({required this.controller, required this.hint, required this.onPick, super.key});

  final TextEditingController controller;
  final String hint;
  final Future<void> Function() onPick;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    readOnly: true,
    onTap: onPick,
    decoration: InputDecoration(
      hintText: hint,
      prefixIcon: const Icon(Icons.location_on_outlined),
      suffixIcon: IconButton(icon: const Icon(Icons.map_outlined), onPressed: onPick),
    ),
  );
}

// Returned object from address picker

class SelectedAddress {
  SelectedAddress({
    required this.fullAddress,
    required this.latitude,
    required this.longitude,
    this.building,
    this.floor,
    this.flat,
    this.howToReach,
  });

  final String fullAddress;
  final double latitude;
  final double longitude;
  final String? building;
  final String? floor;
  final String? flat;
  final String? howToReach;
}
