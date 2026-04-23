import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../models/driver_home_state.dart';
import '../../providers/home_provider.dart';
import '../../services/location_service.dart';
import 'widgets/active_trip_card.dart';
import 'widgets/daily_stats_banner.dart';
import 'widgets/driver_home_header.dart';
import 'widgets/incoming_request_card.dart';
import 'widgets/online_status_toggle.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  mapbox.MapboxMap? _mapboxMap;
  Position? _currentLocation;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      final location = await ref
          .read(locationServiceProvider.notifier)
          .getCurrentLocation();
      if (mounted) {
        setState(() {
          _currentLocation = location;
        });
        _updateCamera();
      }
    } catch (e) {
      // Ignore location fetch error, fallback to default center
    }
  }

  void _onMapCreated(mapbox.MapboxMap map) {
    _mapboxMap = map;
    _updateCamera();
  }

  void _updateCamera() {
    if (_mapboxMap != null && _currentLocation != null) {
      _mapboxMap!.flyTo(
        mapbox.CameraOptions(
          center: mapbox.Point(
            coordinates: mapbox.Position(
              _currentLocation!.longitude,
              _currentLocation!.latitude,
            ),
          ),
          zoom: 14,
        ),
        mapbox.MapAnimationOptions(duration: 500),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(driverStatusProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      body: Stack(
        children: [
          // 1. Map Background
          mapbox.MapWidget(
            key: const ValueKey('driver_home_map'),
            cameraOptions: mapbox.CameraOptions(
              center: mapbox.Point(
                coordinates: mapbox.Position(72.8777, 19.0760),
              ), // Default Mumbai
              zoom: 12,
            ),
            styleUri: isDark
                ? mapbox.MapboxStyles.DARK
                : mapbox.MapboxStyles.LIGHT,
            onMapCreated: _onMapCreated,
          ),

          // 2. Safe Area overlay for UI elements
          SafeArea(
            child: Column(
              children: [
                // Header
                const DriverHomeHeader(),

                // Stats Banner (hide during active delivery or incoming request)
                if (status != DriverStatus.onDelivery)
                  const Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: DailyStatsBanner(),
                  ),

                const Spacer(),

                // Status Toggle / Floating Action (Hide if there's an active trip)
                if (status != DriverStatus.onDelivery &&
                    (ref.watch(nearbyOrdersProvider).valueOrNull?.isEmpty ??
                        true))
                  const Padding(
                    padding: EdgeInsets.only(bottom: 24),
                    child: OnlineStatusToggle(),
                  ),

                // Incoming Request Overlay
                if (status != DriverStatus.onDelivery &&
                    (ref.watch(nearbyOrdersProvider).valueOrNull?.isNotEmpty ??
                        false))
                  const IncomingRequestCard(),

                // Active Trip Overlay
                if (status == DriverStatus.onDelivery) const ActiveTripCard(),

                const SizedBox(height: 16),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
