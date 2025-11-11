// lib/screens/new_order/address_form_screen.dart

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../../models/address_location.dart';
import '../../providers/address_service_provider.dart';
import 'widgets/location_section.dart';

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({this.addressId, this.purpose, this.initialAddress, super.key});

  final String? addressId;
  final String? purpose; // 'pickup' or 'delivery'
  final String? initialAddress;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  // Text controllers
  final _search = TextEditingController();
  final _building = TextEditingController();
  final _floor = TextEditingController();
  final _flat = TextEditingController();
  final _directions = TextEditingController();
  final _searchFocus = FocusNode();

  // Map state
  MapboxMap? _mapboxMap;
  LatLng? _center;
  bool _dragging = false;

  // Debounce timers
  Timer? _searchDebounce;
  Timer? _reverseDebounce;

  // Suggestions
  List<PlaceSuggestion> _suggestions = [];
  bool _loadingSuggestions = false;
  String? _sessionToken;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _searchFocus.requestFocus());
    if (widget.initialAddress?.isNotEmpty ?? false) {
      _search.text = widget.initialAddress!;
    }
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _reverseDebounce?.cancel();
    _search.dispose();
    _building.dispose();
    _floor.dispose();
    _flat.dispose();
    _directions.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final title = widget.purpose == 'delivery' ? 'To' : 'From';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Stack(
        children: [
          // Map with widget-level listeners
          MapWidget(
            key: const ValueKey('shipzy_address_map'),
            cameraOptions: CameraOptions(
              center: Point(coordinates: Position(72.8777, 19.0760)), // lon, lat
              zoom: 14,
            ),
            onMapCreated: _onMapCreated,
            onCameraChangeListener: _onCameraChanged,
            onMapIdleListener: (_) => _onMapIdle(),
          ),

          // Center pin
          IgnorePointer(
            child: Center(
              child: AnimatedScale(
                duration: const Duration(milliseconds: 120),
                scale: _dragging ? 1.15 : 1.0,
                child: Icon(
                  Icons.location_on_rounded,
                  size: 38,
                  color: cs.primary,
                  shadows: [Shadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 6)],
                ),
              ),
            ),
          ),

          // My location button
          Positioned(
            right: 16,
            bottom: 200,
            child: FloatingActionButton.small(heroTag: 'my_location_btn', onPressed: _jumpToMyLocation, child: const Icon(Icons.my_location_rounded)),
          ),

          // Bottom sheet
          DraggableScrollableSheet(
            initialChildSize: 0.36,
            minChildSize: 0.28,
            maxChildSize: 0.70,
            builder: (context, controller) => Container(
              decoration: BoxDecoration(
                color: Theme.of(context).scaffoldBackgroundColor,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.18), blurRadius: 20, offset: const Offset(0, -2))],
              ),
              padding: const EdgeInsets.fromLTRB(16, 10, 16, 16),
              child: ListView(
                controller: controller,
                children: [
                  Center(
                    child: Container(
                      width: 40,
                      height: 4,
                      decoration: BoxDecoration(color: cs.outlineVariant, borderRadius: BorderRadius.circular(2)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const Spacer(),
                      TextButton.icon(onPressed: _collapseSheet, icon: const Icon(Icons.map_rounded, size: 18), label: const Text('Map')),
                    ],
                  ),
                  const SizedBox(height: 10),

                  // Search box
                  TextField(
                    controller: _search,
                    focusNode: _searchFocus,
                    textInputAction: TextInputAction.search,
                    decoration: InputDecoration(
                      hintText: 'Locality and Society Name',
                      prefixIcon: _loadingSuggestions
                          ? const Padding(
                              padding: EdgeInsets.all(12),
                              child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                            )
                          : const Icon(Icons.search_rounded),
                      suffixIcon: _search.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.close_rounded),
                              onPressed: () {
                                _search.clear();
                                setState(() => _suggestions = []);
                              },
                            )
                          : null,
                    ),
                    onChanged: _debouncedSearch,
                    onSubmitted: (_) => _triggerSearch(),
                  ),

                  const SizedBox(height: 10),

                  // Suggestions list
                  if (_suggestions.isNotEmpty) ...[
                    ..._suggestions.map((sug) => _SuggestionTile(suggestion: sug, onTap: () => _selectSuggestion(sug))),
                    const Divider(height: 24),
                  ],

                  // Details
                  Row(
                    children: [
                      Expanded(child: _miniField(_building, 'Building')),
                      const SizedBox(width: 8),
                      Expanded(child: _miniField(_floor, 'Floor')),
                      const SizedBox(width: 8),
                      Expanded(child: _miniField(_flat, 'Flat/Unit')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextField(
                    controller: _directions,
                    maxLines: 2,
                    decoration: const InputDecoration(hintText: 'How to reach'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: _confirm, child: const Text('Confirm')),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Map lifecycle
  Future<void> _onMapCreated(MapboxMap map) async {
    _mapboxMap = map;
    // Read camera center after created (works across platforms)
    final cam = await map.getCameraState();
    _updateCenterFromCamera(cam);
  }

  // Camera changed continuously
  void _onCameraChanged(CameraChangedEventData data) async {
    if (!_dragging) {
      setState(() => _dragging = true);
    }
    // Prefer event.cameraState if present; fallback to querying the map
    final cam = data.cameraState;
    _updateCenterFromCamera(cam);
  }

  // Map idle once after movement
  void _onMapIdle() {
    if (_dragging) {
      setState(() => _dragging = false);
    }
    _reverseDebounce?.cancel();
    _reverseDebounce = Timer(const Duration(milliseconds: 350), _reverseGeocodeCenter);
  }

  void _updateCenterFromCamera(CameraState cam) {
    final coords = cam.center.coordinates;
    if (coords.length >= 2) {
      _center = LatLng(coords[1]?.toDouble() ?? 0.0, coords[0]?.toDouble() ?? 0.0);
    }
  }

  // Search
  void _debouncedSearch(String _) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 300), _triggerSearch);
  }

  Future<void> _triggerSearch() async {
    final q = _search.text.trim();
    if (q.isEmpty) {
      setState(() => _suggestions = []);
      return;
    }
    setState(() => _loadingSuggestions = true);

    try {
      final addressService = ref.read(addressServiceProvider);
      final proximity = _center != null ? '${_center!.longitude},${_center!.latitude}' : null;

      final suggestions = await addressService.searchPlaces(query: q, proximity: proximity, limit: 5);

      if (mounted) {
        setState(() {
          _suggestions = suggestions;
          _sessionToken = suggestions.isNotEmpty ? suggestions.first.sessionToken : null;
          _loadingSuggestions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loadingSuggestions = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to search places: $e')));
      }
    }
  }

  Future<void> _selectSuggestion(PlaceSuggestion suggestion) async {
    if (_sessionToken == null) {
      _search.text = suggestion.fullAddress;
      setState(() => _suggestions = []);
      _searchFocus.unfocus();
      return;
    }

    try {
      final addressService = ref.read(addressServiceProvider);
      final placeDetails = await addressService.retrievePlaceDetails(mapboxId: suggestion.id, sessionToken: _sessionToken!);

      // Fly to the retrieved coordinates
      await _mapboxMap?.flyTo(
        CameraOptions(center: Point(coordinates: Position(placeDetails.coordinates.longitude, placeDetails.coordinates.latitude)), zoom: 15),
        MapAnimationOptions(duration: 800),
      );

      _search.text = placeDetails.fullAddress;
      setState(() => _suggestions = []);
      _searchFocus.unfocus();
    } catch (e) {
      // Fallback to using suggestion data if retrieve fails
      _search.text = suggestion.fullAddress;
      setState(() => _suggestions = []);
      _searchFocus.unfocus();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to retrieve place details: $e')));
      }
    }
  }

  // Reverse geocode on idle
  Future<void> _reverseGeocodeCenter() async {
    if (_center == null) {
      return;
    }

    try {
      final addressService = ref.read(addressServiceProvider);
      final result = await addressService.reverseGeocode(latitude: _center!.latitude, longitude: _center!.longitude);

      if (result.results.isNotEmpty && mounted) {
        // Use the first (most relevant) result
        final bestResult = result.results.first;
        _search.text = bestResult.fullAddress;
      }
    } catch (e) {
      // Silently fail for reverse geocoding - it's not critical
      // User can still manually enter address
    }
  }

  // My location
  Future<void> _jumpToMyLocation() async {
    try {
      final permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied || permission == geo.LocationPermission.deniedForever) {
        await geo.Geolocator.requestPermission();
      }
      final pos = await geo.Geolocator.getCurrentPosition();
      await _mapboxMap?.flyTo(
        CameraOptions(center: Point(coordinates: Position(pos.longitude, pos.latitude)), zoom: 15),
        MapAnimationOptions(duration: 800),
      );
    } catch (e) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not get location: $e')));
    }
  }

  // Confirm and return
  Future<void> _confirm() async {
    if (_search.text.trim().isEmpty && _center != null) {
      await _reverseGeocodeCenter();
    }
    final selected = SelectedAddress(
      fullAddress: _search.text.trim().isEmpty ? 'Pinned location' : _search.text.trim(),
      latitude: _center?.latitude ?? 0.0,
      longitude: _center?.longitude ?? 0.0,
      building: _building.text.trim(),
      floor: _floor.text.trim(),
      flat: _flat.text.trim(),
      howToReach: _directions.text.trim(),
    );
    if (!mounted) {
      return;
    }
    Navigator.of(context).pop(selected);
  }

  void _collapseSheet() {
    _searchFocus.unfocus();
  }

  // Small input helper
  Widget _miniField(TextEditingController c, String hint) => TextField(
    controller: c,
    decoration: const InputDecoration().copyWith(hintText: hint, contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
  );
}

class _SuggestionTile extends StatelessWidget {
  const _SuggestionTile({required this.suggestion, required this.onTap});
  final PlaceSuggestion suggestion;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final name = suggestion.name;
    final address = suggestion.fullAddress;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Icon(Icons.location_on_outlined, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(name, style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                  if (address.isNotEmpty && address != name)
                    Text(
                      address,
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface.withValues(alpha: 0.70)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 16),
          ],
        ),
      ),
    );
  }
}

class LatLng {
  const LatLng(this.latitude, this.longitude);
  final double latitude;
  final double longitude;
}
