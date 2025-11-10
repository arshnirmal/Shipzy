import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../screens/new_order/widgets/location_section.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({this.addressId, super.key, this.purpose, this.initialAddress});

  final String? addressId; // unused for now; keep for future edit flow
  final String? purpose;
  final String? initialAddress;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  final _search = TextEditingController();
  final _building = TextEditingController();
  final _floor = TextEditingController();
  final _flat = TextEditingController();
  final _directions = TextEditingController();
  final _searchFocus = FocusNode();

  // map state
  LatLng? _center;
  final bool _dragging = false;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    // autofocus search when page opens
    WidgetsBinding.instance.addPostFrameCallback((_) => _searchFocus.requestFocus());
    // Set initial address if provided
    if (widget.initialAddress?.isNotEmpty ?? false) {
      _search.text = widget.initialAddress!;
    }
  }

  @override
  void dispose() {
    _search.dispose();
    _building.dispose();
    _floor.dispose();
    _flat.dispose();
    _directions.dispose();
    _searchFocus.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: Text(widget.purpose == 'delivery' ? 'To' : 'From')),
      body: Stack(
        children: [
          // TODO: plug in mapbox_gl or mapbox_maps_flutter
          // Map widget should support onCameraIdle / onCameraMove
          Container(
            color: cs.surfaceContainerHighest,
            child: const Center(
              child: Text('Map Integration\nComing Soon', textAlign: TextAlign.center),
            ),
          ),
          // Center pin
          IgnorePointer(
            child: Center(
              child: AnimatedScale(
                duration: const Duration(milliseconds: 120),
                scale: _dragging ? 1.1 : 1.0,
                child: Icon(Icons.location_on_rounded, size: 36, color: cs.primary),
              ),
            ),
          ),
          // Current location FAB
          Positioned(
            right: 16, bottom: 180,
            child: FloatingActionButton.small(
              onPressed: _jumpToMyLocation,
              child: const Icon(Icons.my_location_rounded),
            ),
          ),
          // Bottom sheet with search + details
          DraggableScrollableSheet(
            initialChildSize: 0.34, minChildSize: 0.25, maxChildSize: 0.66,
            builder: (context, controller) => Container(
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.only(topLeft: Radius.circular(16), topRight: Radius.circular(16)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 18)],
              ),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: ListView(
                controller: controller,
                children: [
                  Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(
                    color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)))),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Text(widget.purpose == 'delivery' ? 'To' : 'From',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      TextButton.icon(
                        onPressed: _openMapOnly,
                        icon: const Icon(Icons.map_rounded, size: 18),
                        label: const Text('Map'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  // Search box
                  TextField(
                    controller: _search,
                    focusNode: _searchFocus,
                    textInputAction: TextInputAction.search,
                    decoration: InputDecoration(
                      hintText: 'Locality and Society Name',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => _search.clear()),
                    ),
                    onChanged: _debouncedSearch,
                    onSubmitted: (_) => _triggerSearch(),
                  ),
                  const SizedBox(height: 12),
                  // TODO: Build suggestions list from /addresses/search
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _miniField(_building, 'Building')),
                      const SizedBox(width: 8),
                      Expanded(child: _miniField(_floor, 'Floor')),
                      const SizedBox(width: 8),
                      Expanded(child: _miniField(_flat, 'Flat/Unit No.')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _directions,
                    decoration: const InputDecoration(hintText: 'How to reach'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _confirm,
                    child: const Text('Confirm'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _miniField(TextEditingController c, String hint) =>
      TextField(controller: c, decoration: InputDecoration(hintText: hint));

  void _debouncedSearch(String _) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () => _triggerSearch());
  }

  Future<void> _triggerSearch() async {
    final q = _search.text.trim();
    if (q.isEmpty) return;

    // Call POST /addresses/search with session token and proximity
    // Display suggestions in the sheet, and on tap:
    // - Call POST /addresses/retrieve, move map to result bbox, and update _center
    return;
  }

  Future<void> _jumpToMyLocation() async {
    // Get device location and animate the camera
    return;
  }

  Future<void> _confirm() async {
    // Reverse geocode current camera center if needed
    // Then pop with a SelectedAddress
    final sel = SelectedAddress(
      fullAddress: _search.text.trim().isEmpty ? 'Pinned location' : _search.text.trim(),
      latitude: _center?.latitude ?? 0,
      longitude: _center?.longitude ?? 0,
      building: _building.text,
      floor: _floor.text,
      flat: _flat.text,
      howToReach: _directions.text,
    );
    if (!mounted) {
      return;
    }
    Navigator.of(context).pop(sel);
  }

  void _openMapOnly() {/* optional: collapse sheet */}
}

// LatLng class for map coordinates (placeholder until map integration)
class LatLng {
  const LatLng(this.latitude, this.longitude);
  final double latitude;
  final double longitude;
}
