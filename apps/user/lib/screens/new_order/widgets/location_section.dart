import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

typedef AddressChanged = void Function(
  String address,
  double latitude,
  double longitude,
  String contactName,
  String contactPhone,
);

class LocationSection extends ConsumerStatefulWidget {
  const LocationSection({
    super.key,
    required this.onPickupChanged,
    required this.onDeliveryChanged,
  });

  final AddressChanged onPickupChanged;
  final AddressChanged onDeliveryChanged;

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
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Locations', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 12),
        _SectionHeader(index: 1, title: 'Pickup point'),
        const SizedBox(height: 8),
        _addressField(_pickAddr, hint: 'Pickup address', onTapMap: () async {
          // Hook your place picker here, then call:
          // widget.onPickupChanged(address, lat, lng, _pickName.text, _pickPhone.text);
        }),
        const SizedBox(height: 8),
        _namePhoneRow(_pickName, _pickPhone),
        const SizedBox(height: 16),
        _SectionHeader(index: 2, title: 'Delivery point'),
        const SizedBox(height: 8),
        _addressField(_delAddr, hint: 'Delivery address', onTapMap: () async {
          // Hook your place picker here, then call onDeliveryChanged
        }),
        const SizedBox(height: 8),
        _namePhoneRow(_delName, _delPhone),
        const SizedBox(height: 8),
        // Apply to provider on any change (basic)
        ElevatedButton.icon(
          onPressed: () {
            if (_pickAddr.text.isEmpty || _delAddr.text.isEmpty) return;
            widget.onPickupChanged(_pickAddr.text, 0, 0, _pickName.text, _pickPhone.text);
            widget.onDeliveryChanged(_delAddr.text, 0, 0, _delName.text, _delPhone.text);
          },
          icon: const Icon(Icons.check_circle_outline),
          label: const Text('Confirm addresses'),
        ),
      ],
    );
  }

  Widget _addressField(TextEditingController c, {required String hint, VoidCallback? onTapMap}) {
    return TextField(
      controller: c,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: const Icon(Icons.location_on_outlined),
        suffixIcon: IconButton(
          icon: const Icon(Icons.map_outlined),
          onPressed: onTapMap,
        ),
      ),
    );
  }

  Widget _namePhoneRow(TextEditingController name, TextEditingController phone) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: name,
            decoration: const InputDecoration(
              hintText: 'Contact name',
              prefixIcon: Icon(Icons.person_outline),
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: TextField(
            controller: phone,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(
              hintText: 'Phone number',
              prefixIcon: Icon(Icons.call_outlined),
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.index, required this.title});

  final int index;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text('$index', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(width: 6),
        Text(title, style: Theme.of(context).textTheme.titleMedium),
      ],
    );
  }
}
