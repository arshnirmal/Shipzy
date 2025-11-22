// lib/screens/new_order/address_form_screen.dart

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

import '../../models/address_location.dart';
import '../../providers/address_service_provider.dart';
import '../../utils/snackbar_utils.dart';
import 'widgets/location_section.dart'; // For SelectedAddress

class AddressFormScreen extends ConsumerStatefulWidget {
  const AddressFormScreen({
    this.purpose,
    this.initialAddress,
    this.initialLatitude,
    this.initialLongitude,
    this.initialBuilding,
    this.initialFloor,
    this.initialFlat,
    this.initialHowToReach,
    super.key,
  });

  final String? purpose;
  final String? initialAddress;
  final double? initialLatitude;
  final double? initialLongitude;
  final String? initialBuilding;
  final String? initialFloor;
  final String? initialFlat;
  final String? initialHowToReach;

  @override
  ConsumerState<AddressFormScreen> createState() => _AddressFormScreenState();
}

class _AddressFormScreenState extends ConsumerState<AddressFormScreen> {
  // --- State & Controllers ---
  final _search = TextEditingController();
  final _building = TextEditingController();
  final _floor = TextEditingController();
  final _flat = TextEditingController();
  final _directions = TextEditingController();
  final _searchFocus = FocusNode();
  final _sheetController = DraggableScrollableController();

  MapboxMap? _mapboxMap;
  Coordinates? _center;
  bool _isDragging = false;
  bool _isSearchFocused = false;
  bool _isKeyboardVisible = false;

  Timer? _searchDebounce;
  Timer? _reverseDebounce;

  List<PlaceSuggestion> _suggestions = [];
  bool _loadingSuggestions = false;
  String? _sessionToken;

  // --- Lifecycle ---
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocus.requestFocus();
    });

    // Initialize fields
    if (widget.initialAddress?.isNotEmpty ?? false) {
      _search.text = widget.initialAddress!;
    }
    if (widget.initialBuilding?.isNotEmpty ?? false) {
      _building.text = widget.initialBuilding!;
    }
    if (widget.initialFloor?.isNotEmpty ?? false) {
      _floor.text = widget.initialFloor!;
    }
    if (widget.initialFlat?.isNotEmpty ?? false) {
      _flat.text = widget.initialFlat!;
    }
    if (widget.initialHowToReach?.isNotEmpty ?? false) {
      _directions.text = widget.initialHowToReach!;
    }

    // Initialize center if coordinates provided
    if (widget.initialLatitude != null && widget.initialLongitude != null) {
      _center = Coordinates(latitude: widget.initialLatitude, longitude: widget.initialLongitude);
    }

    _searchFocus.addListener(_onFocusChange);
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
    _searchFocus.removeListener(_onFocusChange);
    _searchFocus.dispose();
    _sheetController.dispose();
    super.dispose();
  }

  // --- UI Build ---
  @override
  Widget build(BuildContext context) {
    _isKeyboardVisible = MediaQuery.of(context).viewInsets.bottom > 0;
    final sheetInitialSize = _isKeyboardVisible ? 0.85 : 0.40;
    final sheetMaxSize = _isKeyboardVisible ? 0.90 : 0.75;

    final cs = Theme.of(context).colorScheme;

    return GestureDetector(
      onTap: () {
        // Unfocus search bar when tapping outside
        if (_searchFocus.hasFocus) {
          _searchFocus.unfocus();
        }
      },
      child: Scaffold(
        resizeToAvoidBottomInset: false, // Prevent flutter from resizing on keyboard
        body: Stack(
          children: [
            // --- Map ---
            MapWidget(
              key: const ValueKey('shipzy_address_map'),
              cameraOptions: CameraOptions(
                center: _center != null
                    ? Point(coordinates: Position(_center!.longitude ?? 0, _center!.latitude ?? 0))
                    : Point(coordinates: Position(72.8777, 19.0760)), // Default to Mumbai
                zoom: 12,
                padding: MbxEdgeInsets(top: 0, left: 0, bottom: MediaQuery.of(context).size.height * sheetInitialSize, right: 0),
              ),
              styleUri: isDarkMode(context) ? MapboxStyles.DARK : MapboxStyles.LIGHT,
              onMapCreated: _onMapCreated,
              onCameraChangeListener: _onCameraChanged,
              onMapIdleListener: (_) => _onMapIdle(),
            ),

            // --- Center Marker ---
            if (!_isSearchFocused)
              Positioned(
                left: 0,
                right: 0,
                top: 0,
                bottom: MediaQuery.of(context).size.height * sheetInitialSize,
                child: IgnorePointer(
                  child: Center(
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 40), // Align pin tip to center (height is 40)
                      child: AnimatedScale(
                        duration: const Duration(milliseconds: 150),
                        scale: _isDragging ? 1.2 : 1.0,
                        child: Image.asset(
                          'assets/mapbox/marker.png',
                          height: 40,
                          width: 40,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => Icon(Icons.location_on, size: 40, color: cs.primary),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

            // --- Floating Back Button ---
            Positioned(
              top: 40,
              left: 16,
              child: FloatingActionButton.small(
                heroTag: 'back_btn',
                onPressed: () => Navigator.of(context).pop(),
                backgroundColor: cs.surface,
                child: Icon(Icons.arrow_back, color: cs.onSurface),
              ),
            ),

            // --- My Location FAB ---
            if (!_isSearchFocused)
              Positioned(
                right: 16,
                bottom: MediaQuery.of(context).size.height * sheetInitialSize + 20,
                child: FloatingActionButton.small(heroTag: 'my_location_btn', onPressed: _jumpToMyLocation, child: const Icon(Icons.my_location)),
              ),

            // --- Bottom Sheet ---
            DraggableScrollableSheet(
              controller: _sheetController,
              initialChildSize: sheetInitialSize,
              minChildSize: 0.35,
              maxChildSize: sheetMaxSize,
              builder: (context, scrollController) => Container(
                decoration: BoxDecoration(
                  color: cs.surface,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                  boxShadow: [BoxShadow(color: Colors.black.withAlpha(50), blurRadius: 15)],
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    // Handle
                    Container(
                      width: 40,
                      height: 4,
                      margin: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(color: cs.onSurface.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(2)),
                    ),

                    // Search Field
                    TextField(
                      controller: _search,
                      focusNode: _searchFocus,
                      decoration: InputDecoration(
                        hintText: 'Search for society or locality',
                        prefixIcon: const Icon(Icons.search),
                        suffixIcon: _search.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear),
                                onPressed: () {
                                  _search.clear();
                                  setState(() => _suggestions = []);
                                },
                              )
                            : null,
                      ),
                      onChanged: _debouncedSearch,
                    ),
                    const SizedBox(height: 10),

                    // Main Content (Suggestions or Detail Form)
                    Expanded(
                      child: AnimatedSwitcher(
                        duration: const Duration(milliseconds: 250),
                        child: _isSearchFocused ? _buildSuggestionsList(scrollController) : _buildDetailForm(scrollController),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ), // Close Scaffold
    ); // Close GestureDetector
  }

  // --- Widgets ---
  Widget _buildSuggestionsList(ScrollController controller) {
    if (_loadingSuggestions) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_suggestions.isEmpty && _search.text.isNotEmpty) {
      return const Center(child: Text('No results found.'));
    }
    return ListView.builder(
      controller: controller,
      itemCount: _suggestions.length,
      itemBuilder: (context, index) {
        final sug = _suggestions[index];
        return _suggestionItem(suggestion: sug, onTap: () => _selectSuggestion(sug));
      },
    );
  }

  Widget _buildDetailForm(ScrollController controller) => ListView(
    controller: controller,
    padding: const EdgeInsets.only(top: 8, bottom: 20),
    children: [
      Row(
        children: [
          Expanded(child: _miniField(_building, 'Building')),
          const SizedBox(width: 10),
          Expanded(child: _miniField(_floor, 'Floor')),
          const SizedBox(width: 10),
          Expanded(child: _miniField(_flat, 'Flat/Unit No.')),
        ],
      ),
      const SizedBox(height: 12),
      TextField(
        controller: _directions,
        maxLines: 2,
        minLines: 1,
        decoration: const InputDecoration(hintText: 'How to reach (optional)'),
      ),
      const SizedBox(height: 20),
      ElevatedButton(onPressed: _confirm, child: const Text('Confirm Address')),
    ],
  );

  Widget _miniField(TextEditingController controller, String hint) => TextField(
    controller: controller,
    decoration: InputDecoration(hintText: hint, isDense: true),
  );

  Widget _suggestionItem({required PlaceSuggestion suggestion, required VoidCallback onTap}) {
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    IconData icon;
    Color iconColor;

    // Determine icon based on place type
    if (suggestion.placeType == 'poi') {
      icon = Icons.store_mall_directory_outlined;
      iconColor = Colors.orange;
    } else if (suggestion.placeType == 'street') {
      icon = Icons.add_road;
      iconColor = Colors.blue;
    } else {
      icon = Icons.location_on_outlined;
      iconColor = cs.primary;
    }

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 4),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey[900] : Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: iconColor.withValues(alpha: 0.1), shape: BoxShape.circle),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        suggestion.name,
                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        suggestion.fullAddress,
                        style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(Icons.north_west, size: 16, color: cs.outline),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // --- Logic & Handlers ---
  void _onFocusChange() {
    if (_isSearchFocused != _searchFocus.hasFocus) {
      setState(() => _isSearchFocused = _searchFocus.hasFocus);
      // Keyboard visibility is now handled by the build method, which listens to MediaQuery
    }
  }

  bool isDarkMode(BuildContext context) => Theme.of(context).brightness == Brightness.dark;

  Future<void> _onMapCreated(MapboxMap map) async {
    _mapboxMap = map;
    final cam = await map.getCameraState();
    _updateCenterFromCamera(cam);
  }

  void _onCameraChanged(CameraChangedEventData data) {
    if (!_isDragging) {
      setState(() => _isDragging = true);

      // Unfocus search bar when user starts dragging the map
      if (_searchFocus.hasFocus) {
        _searchFocus.unfocus();
      }
    }
  }

  bool _ignoreFirstReverseGeocode = true;
  bool _skipNextReverseGeocode = false;

  void _onMapIdle() async {
    if (_isDragging) {
      setState(() => _isDragging = false);
      final cam = await _mapboxMap?.getCameraState();
      if (cam != null) {
        _updateCenterFromCamera(cam);

        if (_ignoreFirstReverseGeocode) {
          _ignoreFirstReverseGeocode = false;
          return;
        }

        // Skip reverse geocoding if we just programmatically moved the map
        if (_skipNextReverseGeocode) {
          _skipNextReverseGeocode = false;
          return;
        }

        _reverseDebounce?.cancel();
        _reverseDebounce = Timer(const Duration(milliseconds: 750), _reverseGeocodeCenter);
      }
    }
  }

  void _updateCenterFromCamera(CameraState cam) {
    final coords = cam.center.coordinates;
    if (coords.length >= 2) {
      _center = Coordinates(latitude: coords[1]!.toDouble(), longitude: coords[0]!.toDouble());
    }
  }

  void _debouncedSearch(String query) {
    _searchDebounce?.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 800), () => _triggerSearch(query));
  }

  Future<void> _triggerSearch(String query) async {
    if (query.trim().isEmpty) {
      return;
    }
    setState(() => _loadingSuggestions = true);

    try {
      final addressService = ref.read(addressServiceProvider);
      final proximity = _center != null ? '${_center!.longitude},${_center!.latitude}' : null;

      final results = await addressService.searchPlaces(query: query, proximity: proximity, limit: 10);

      if (mounted) {
        setState(() {
          _suggestions = results;
          // Store session token from first suggestion if available
          if (results.isNotEmpty && results.first.sessionToken != null) {
            _sessionToken = results.first.sessionToken;
          }
          _loadingSuggestions = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _suggestions = [];
          _loadingSuggestions = false;
        });
        SnackbarUtils.showError(context, 'Failed to search addresses: ${e.toString()}');
      }
    }
  }

  Future<void> _selectSuggestion(PlaceSuggestion suggestion) async {
    try {
      final addressService = ref.read(addressServiceProvider);

      // Use session token from suggestion or stored token
      final sessionToken = suggestion.sessionToken ?? _sessionToken ?? '';

      PlaceDetails? details;
      if (sessionToken.isNotEmpty) {
        // Retrieve full place details
        details = await addressService.retrievePlaceDetails(mapboxId: suggestion.id, sessionToken: sessionToken);
      }

      if (details == null) {
        // If no session token or retrieve failed, use coordinates from suggestion directly
        final newCoords = suggestion.coordinates;
        if (newCoords.latitude == null || newCoords.longitude == null) {
          if (mounted) {
            SnackbarUtils.showError(context, 'Location details not available. Please select another result.');
          }
          return;
        }

        _search.text = '${suggestion.name}, ${suggestion.fullAddress}';
        _searchFocus.unfocus(); // This will trigger the focus listener

        _skipNextReverseGeocode = true; // Skip reverse geocode after programmatic flyTo
        await _mapboxMap?.flyTo(
          CameraOptions(center: Point(coordinates: Position(newCoords.longitude!, newCoords.latitude!)), zoom: 16),
          MapAnimationOptions(duration: 800),
        );
        return;
      }

      final newCoords = details.coordinates;
      _search.text = '${details.name}, ${details.fullAddress}';
      _searchFocus.unfocus(); // This will trigger the focus listener

      _skipNextReverseGeocode = true; // Skip reverse geocode after programmatic flyTo
      if (newCoords.longitude != null && newCoords.latitude != null) {
        await _mapboxMap?.flyTo(
          CameraOptions(center: Point(coordinates: Position(newCoords.longitude ?? 0, newCoords.latitude ?? 0)), zoom: 16),
          MapAnimationOptions(duration: 800),
        );
      }
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to retrieve address details: ${e.toString()}');
      }
    }
  }

  Future<void> _reverseGeocodeCenter() async {
    if (_center == null) {
      return;
    }

    try {
      final addressService = ref.read(addressServiceProvider);
      final result = await addressService.reverseGeocode(latitude: _center!.latitude ?? 0, longitude: _center!.longitude ?? 0);

      if (result.results.isNotEmpty && mounted) {
        final firstResult = result.results.first;
        _search.text = firstResult.fullAddress;
      }
    } catch (e) {
      // Silently fail for reverse geocoding - it's not critical
      // The user can still manually enter the address
    }
  }

  Future<void> _jumpToMyLocation() async {
    try {
      var permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied) {
        permission = await geo.Geolocator.requestPermission();
      }
      if (permission == geo.LocationPermission.deniedForever) {
        return;
      }

      final position = await geo.Geolocator.getCurrentPosition();
      final mapboxMap = _mapboxMap;
      if (mapboxMap != null) {
        await mapboxMap.flyTo(
          CameraOptions(center: Point(coordinates: Position(position.longitude, position.latitude)), zoom: 16),
          MapAnimationOptions(duration: 800, startDelay: 0),
        );
      }
    } catch (e) {
      // Handle error
    }
  }

  void _confirm() {
    final address = SelectedAddress(
      fullAddress: _search.text.trim(),
      latitude: _center?.latitude ?? 0.0,
      longitude: _center?.longitude ?? 0.0,
      building: _building.text.trim(),
      floor: _floor.text.trim(),
      flat: _flat.text.trim(),
      howToReach: _directions.text.trim(),
    );
    Navigator.of(context).pop(address);
  }
}
