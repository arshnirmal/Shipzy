import 'dart:async';
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../../models/driver_home_state.dart';
import '../../providers/home_provider.dart';
import '../../services/location_service.dart';
import '../../theme/app_palette.dart';
import 'widgets/active_trip_card.dart';
import 'widgets/daily_stats_banner.dart';
import 'widgets/driver_home_header.dart';
import 'widgets/incoming_request_card.dart';
import 'widgets/online_status_toggle.dart';

enum LocationErrorType {
  servicesDisabled,
  permissionDenied,
  permissionPermanentlyDenied,
}

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> with WidgetsBindingObserver {
  mapbox.MapboxMap? _mapboxMap;
  mapbox.PointAnnotationManager? _pointAnnotationManager;
  geo.Position? _currentLocation;
  Brightness? _lastBrightness;
  // Guards camera refits and marker updates: only fires on state transitions.
  int? _prevCardState;

  LocationErrorType? _locationError;
  bool _isCheckingLocation = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    unawaited(_checkLocationStatus());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      unawaited(_checkLocationStatus());
    }
  }

  Future<void> _checkLocationStatus() async {
    if (_isCheckingLocation) {
      return;
    }
    setState(() => _isCheckingLocation = true);

    try {
      final servicesEnabled = await geo.Geolocator.isLocationServiceEnabled();
      if (!servicesEnabled) {
        if (mounted) {
          setState(() {
            _locationError = LocationErrorType.servicesDisabled;
            _isCheckingLocation = false;
          });
        }
        return;
      }

      final permission = await geo.Geolocator.checkPermission();
      if (permission == geo.LocationPermission.denied) {
        if (mounted) {
          setState(() {
            _locationError = LocationErrorType.permissionDenied;
            _isCheckingLocation = false;
          });
        }
        return;
      }

      if (permission == geo.LocationPermission.deniedForever) {
        if (mounted) {
          setState(() {
            _locationError = LocationErrorType.permissionPermanentlyDenied;
            _isCheckingLocation = false;
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _locationError = null;
          _isCheckingLocation = false;
        });
        unawaited(_initLocation());
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isCheckingLocation = false);
      }
    }
  }

  Future<void> _initLocation() async {
    try {
      final location = await ref
          .read(locationServiceProvider.notifier)
          .getCurrentLocation();
      if (mounted) {
        setState(() => _currentLocation = location);
        _updateCamera();
      }
    } catch (_) {}
  }

  void _onMapCreated(mapbox.MapboxMap map) {
    _mapboxMap = map;

    _mapboxMap?.location.updateSettings(
      mapbox.LocationComponentSettings(
        enabled: true,
        pulsingEnabled: true,
        showAccuracyRing: true,
        puckBearingEnabled: true,
      ),
    );
    _mapboxMap?.compass.updateSettings(mapbox.CompassSettings(enabled: false));
    _mapboxMap?.scaleBar.updateSettings(
      mapbox.ScaleBarSettings(enabled: false),
    );
    _mapboxMap?.logo.updateSettings(
      mapbox.LogoSettings(
        position: mapbox.OrnamentPosition.BOTTOM_RIGHT,
        marginBottom: 8,
        marginRight: 8,
      ),
    );
    _mapboxMap?.attribution.updateSettings(
      mapbox.AttributionSettings(
        position: mapbox.OrnamentPosition.BOTTOM_RIGHT,
        marginBottom: 8,
        marginRight: 60,
      ),
    );

    _mapboxMap?.annotations.createPointAnnotationManager().then((manager) {
      _pointAnnotationManager = manager;
      _updateMarkers();
    });

    _updateCamera();
  }

  void _jumpToMyLocation() {
    if (_currentLocation != null) {
      _updateCamera();
    } else {
      _initLocation();
    }
  }

  void _updateCamera({mapbox.MbxEdgeInsets? padding}) {
    if (_mapboxMap == null || _currentLocation == null) {
      return;
    }
    _mapboxMap!.flyTo(
      mapbox.CameraOptions(
        center: mapbox.Point(
          coordinates: mapbox.Position(
            _currentLocation!.longitude,
            _currentLocation!.latitude,
          ),
        ),
        zoom: 15,
        padding: padding,
      ),
      mapbox.MapAnimationOptions(duration: 800),
    );
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(driverStatusProvider);
    final nearbyOrdersAsync = ref.watch(nearbyOrdersProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    // Reactively update map style when theme brightness changes
    final currentBrightness = theme.brightness;
    if (_lastBrightness != null && _lastBrightness != currentBrightness) {
      _mapboxMap?.loadStyleURI(
        isDark ? mapbox.MapboxStyles.DARK : mapbox.MapboxStyles.LIGHT,
      );
    }
    _lastBrightness = currentBrightness;

    final hasActiveTrip = status == DriverStatus.onDelivery;
    final hasNearbyOrders = nearbyOrdersAsync.valueOrNull?.isNotEmpty ?? false;
    final hasIncomingRequest = !hasActiveTrip && hasNearbyOrders;
    final isSearching = status == DriverStatus.online && !hasIncomingRequest;
    final showToggle = !hasActiveTrip && !hasIncomingRequest;
    final showBottomCard = hasIncomingRequest || hasActiveTrip;

    final currentCardState = hasActiveTrip ? 2 : (hasIncomingRequest ? 1 : 0);

    // Only refit camera and update markers when card state transitions, not on every rebuild.
    if (_prevCardState != currentCardState) {
      _prevCardState = currentCardState;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _mapboxMap == null) {
          return;
        }
        unawaited(_updateMarkers());
        if (currentCardState > 0) {
          unawaited(_fitCameraToOrder());
        } else {
          _updateCamera();
        }
      });
    }

    // Reactively refresh markers if the active order status changes within state 2
    ref.listen(activeOrderProvider, (previous, next) {
      if (next.hasValue && _prevCardState == 2) {
        unawaited(_updateMarkers());
      }
    });

    // Reactively refresh markers if the incoming request list changes within state 1
    ref.listen(nearbyOrdersProvider, (previous, next) {
      if (next.hasValue && _prevCardState == 1) {
        unawaited(_updateMarkers());
      }
    });

    // Estimate height for FAB offset above bottom card
    final fabBottomOffset = hasActiveTrip
        ? 296.0
        : hasIncomingRequest
            ? 348.0
            : 72.0;

    return Column(
      children: [
        // ── App bar — opaque, above the map ───────────────────────
        const DriverHomeHeader(),

        // ── Map + overlays fill remaining screen ──────────────────
        Expanded(
          child: Stack(
            children: [
              mapbox.MapWidget(
                key: const ValueKey('driver_home_map'),
                cameraOptions: mapbox.CameraOptions(
                  center: mapbox.Point(
                    coordinates: mapbox.Position(72.8777, 19.0760),
                  ),
                  zoom: 15,
                ),
                styleUri: isDark
                    ? mapbox.MapboxStyles.DARK
                    : mapbox.MapboxStyles.LIGHT,
                onMapCreated: _onMapCreated,
              ),

              // Daily stats — floats just below the app bar over the map
              if (!hasActiveTrip)
                const Positioned(
                  top: 8,
                  left: 0,
                  right: 0,
                  child: DailyStatsBanner(),
                ),

              // Scrim — softens the map edge above the bottom card.
              // Rendered behind the cards so the gradient shows only on
              // the map area above the card's top edge.
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                height: 480,
                child: IgnorePointer(
                  child: AnimatedOpacity(
                    opacity: showBottomCard ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 350),
                    child: DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            theme.colorScheme.surface.withValues(alpha: 0.55),
                          ],
                          stops: const [0.0, 0.68],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // My-location FAB
              Positioned(
                right: 16,
                bottom: fabBottomOffset + 12,
                child: FloatingActionButton.small(
                  heroTag: 'my_location_btn',
                  onPressed: _jumpToMyLocation,
                  backgroundColor: theme.colorScheme.surface,
                  elevation: 2,
                  child: Icon(
                    Icons.my_location_rounded,
                    color: theme.colorScheme.primary,
                  ),
                ),
              ),

              // Offline dim overlay
              if (status == DriverStatus.offline && _locationError == null) const _OfflineOverlay(),

              // Bottom controls
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Toggle + searching pill — AnimatedSize collapses this
                    // region smoothly when a bottom card takes over.
                    AnimatedSize(
                      duration: const Duration(milliseconds: 320),
                      curve: Curves.easeOutCubic,
                      alignment: Alignment.bottomCenter,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (isSearching)
                            const Padding(
                              padding: EdgeInsets.only(bottom: 12),
                              child: Center(child: _SearchingPill()),
                            ),
                          if (showToggle)
                            const Padding(
                              padding: EdgeInsets.only(bottom: 20),
                              child: Center(child: OnlineStatusToggle()),
                            ),
                        ],
                      ),
                    ),

                    // Incoming request or active trip card — slides up from
                    // below on entry, fades + slides out on exit.
                    AnimatedSwitcher(
                      duration: const Duration(milliseconds: 380),
                      switchInCurve: Curves.easeOutCubic,
                      switchOutCurve: Curves.easeInCubic,
                      layoutBuilder: (currentChild, previousChildren) => Stack(
                        clipBehavior: Clip.none,
                        alignment: Alignment.bottomCenter,
                        children: [
                          ...previousChildren,
                          if (currentChild != null) currentChild,
                        ],
                      ),
                      transitionBuilder: (child, animation) => SlideTransition(
                        position: Tween<Offset>(
                          begin: const Offset(0, 1),
                          end: Offset.zero,
                        ).animate(
                          CurvedAnimation(
                            parent: animation,
                            curve: Curves.easeOutCubic,
                          ),
                        ),
                        child: FadeTransition(
                          opacity: animation,
                          child: child,
                        ),
                      ),
                      child: hasIncomingRequest
                          ? const IncomingRequestCard(
                              key: ValueKey('request'),
                            )
                          : hasActiveTrip
                              ? const ActiveTripCard(
                                  key: ValueKey('active_trip'),
                                )
                              : const SizedBox.shrink(
                                  key: ValueKey('no_card'),
                                ),
                    ),

                    const SizedBox(height: 8),
                  ],
                ),
              ),

              // Location error overlay blocks all interactions
              if (_locationError != null)
                _LocationErrorOverlay(
                  errorType: _locationError!,
                  onResolve: () async {
                    if (_locationError == LocationErrorType.servicesDisabled) {
                      await geo.Geolocator.openLocationSettings();
                    } else if (_locationError == LocationErrorType.permissionDenied) {
                      await geo.Geolocator.requestPermission();
                      unawaited(_checkLocationStatus());
                    } else if (_locationError == LocationErrorType.permissionPermanentlyDenied) {
                      await geo.Geolocator.openAppSettings();
                    }
                  },
                ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _updateMarkers() async {
    if (_mapboxMap == null || _pointAnnotationManager == null) {
      return;
    }
    final isDark = Theme.of(context).brightness == Brightness.dark;
    await _pointAnnotationManager?.deleteAll();

    final activeOrder = ref.read(activeOrderProvider).valueOrNull;
    final nearbyOrders = ref.read(nearbyOrdersProvider).valueOrNull ?? [];

    final hasActiveTrip = activeOrder != null;
    final hasIncomingRequest = !hasActiveTrip && nearbyOrders.isNotEmpty;

    mapbox.Point? pickupPoint;
    mapbox.Point? deliveryPoint;

    if (hasActiveTrip) {
      final pickup = activeOrder.routing.pickup;
      final delivery = activeOrder.routing.delivery;
      if (pickup != null) {
        pickupPoint = mapbox.Point(
          coordinates: mapbox.Position(pickup.longitude, pickup.latitude),
        );
      }
      if (delivery != null) {
        deliveryPoint = mapbox.Point(
          coordinates: mapbox.Position(delivery.longitude, delivery.latitude),
        );
      }
    } else if (hasIncomingRequest) {
      final incoming = nearbyOrders.first.order;
      final pickup = incoming.locations.pickup;
      final delivery = incoming.locations.delivery;
      pickupPoint = mapbox.Point(
        coordinates: mapbox.Position(pickup.longitude, pickup.latitude),
      );
      deliveryPoint = mapbox.Point(
        coordinates: mapbox.Position(delivery.longitude, delivery.latitude),
      );
    }

    final annotations = <mapbox.PointAnnotationOptions>[
      if (pickupPoint != null)
        mapbox.PointAnnotationOptions(
          geometry: pickupPoint,
          textField: 'Pickup',
          textColor:
              (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
                  .toARGB32(),
          textSize: 12,
          textOffset: [0, 2],
        ),
      if (deliveryPoint != null)
        mapbox.PointAnnotationOptions(
          geometry: deliveryPoint,
          textField: 'Delivery',
          textColor:
              (isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary)
                  .toARGB32(),
          textSize: 12,
          textOffset: [0, 2],
        ),
    ];

    if (annotations.isNotEmpty) {
      await _pointAnnotationManager?.createMulti(annotations);
    }
  }

  Future<void> _fitCameraToOrder() async {
    if (_mapboxMap == null) {
      return;
    }

    final activeOrder = ref.read(activeOrderProvider).valueOrNull;
    final nearbyOrders = ref.read(nearbyOrdersProvider).valueOrNull ?? [];

    final hasActiveTrip = activeOrder != null;
    final hasIncomingRequest = !hasActiveTrip && nearbyOrders.isNotEmpty;

    double? pickupLat;
    double? pickupLng;
    double? deliveryLat;
    double? deliveryLng;

    if (hasActiveTrip) {
      final pickup = activeOrder.routing.pickup;
      final delivery = activeOrder.routing.delivery;
      pickupLat = pickup?.latitude;
      pickupLng = pickup?.longitude;
      deliveryLat = delivery?.latitude;
      deliveryLng = delivery?.longitude;
    } else if (hasIncomingRequest) {
      final incoming = nearbyOrders.first.order;
      pickupLat = incoming.locations.pickup.latitude;
      pickupLng = incoming.locations.pickup.longitude;
      deliveryLat = incoming.locations.delivery.latitude;
      deliveryLng = incoming.locations.delivery.longitude;
    }

    final points = <mapbox.Point>[
      if (pickupLat != null && pickupLng != null)
        mapbox.Point(
          coordinates: mapbox.Position(pickupLng, pickupLat),
        ),
      if (deliveryLat != null && deliveryLng != null)
        mapbox.Point(
          coordinates: mapbox.Position(deliveryLng, deliveryLat),
        ),
      if (_currentLocation != null)
        mapbox.Point(
          coordinates: mapbox.Position(
            _currentLocation!.longitude,
            _currentLocation!.latitude,
          ),
        ),
    ];

    if (points.isEmpty) {
      return;
    }

    final camera = await _mapboxMap?.cameraForCoordinatesPadding(
      points,
      mapbox.CameraOptions(),
      mapbox.MbxEdgeInsets(top: 60, left: 40, bottom: 340, right: 40),
      null,
      null,
    );

    if (camera != null) {
      await _mapboxMap?.flyTo(
        camera,
        mapbox.MapAnimationOptions(duration: 1000),
      );
    }
  }
}

// ── Offline dim overlay ────────────────────────────────────────────

class _OfflineOverlay extends StatelessWidget {
  const _OfflineOverlay();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Positioned.fill(
      child: IgnorePointer(
        child: Align(
          alignment: const Alignment(0, -0.3),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(20),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 9,
                ),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withValues(alpha: 0.88),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  "You're currently offline",
                  style: theme.textTheme.labelLarge?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.4,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ── Searching pill ─────────────────────────────────────────────────

class _SearchingPill extends StatelessWidget {
  const _SearchingPill();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withValues(alpha: 0.92),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: (isDark
                        ? AppPalette.darkPrimary
                        : AppPalette.lightPrimary)
                    .withValues(alpha: 0.15),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              SizedBox(
                width: 14,
                height: 14,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation(
                    theme.colorScheme.primary,
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Searching for nearby orders…',
                style: theme.textTheme.labelMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Location Error Overlay ──────────────────────────────────────────

class _LocationErrorOverlay extends StatelessWidget {
  const _LocationErrorOverlay({
    required this.errorType,
    required this.onResolve,
  });

  final LocationErrorType errorType;
  final VoidCallback onResolve;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final String title;
    final String description;
    final String actionText;
    final IconData icon;
    final List<Color> gradientColors;

    switch (errorType) {
      case LocationErrorType.servicesDisabled:
        title = 'Location Services Disabled';
        description = 'Your device location services are turned off. Please enable them to view and receive delivery orders near you.';
        actionText = 'Enable Location';
        icon = Icons.location_off_rounded;
        gradientColors = isDark
            ? [AppPalette.darkError, const Color(0xFFE05555)]
            : [AppPalette.lightError, const Color(0xFFE05555)];
        break;
      case LocationErrorType.permissionDenied:
        title = 'Location Permission Required';
        description = 'Shipzy Driver requires location permissions to appear online, calculate delivery routes, and assign nearby trips.';
        actionText = 'Grant Permission';
        icon = Icons.location_searching_rounded;
        gradientColors = isDark
            ? [AppPalette.darkPrimary, const Color(0xFF4776E6)]
            : [AppPalette.lightPrimary, const Color(0xFF4776E6)];
        break;
      case LocationErrorType.permissionPermanentlyDenied:
        title = 'Location Access Denied';
        description = 'Location access is permanently denied. To continue using the app, please open App Settings and enable location permissions.';
        actionText = 'Open App Settings';
        icon = Icons.gpp_bad_rounded;
        gradientColors = isDark
            ? [AppPalette.darkPrimary, const Color(0xFF4776E6)]
            : [AppPalette.lightPrimary, const Color(0xFF4776E6)];
        break;
    }

    return Positioned.fill(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          color: (isDark ? Colors.black : Colors.white).withValues(alpha: 0.75),
          padding: const EdgeInsets.symmetric(horizontal: 24),
          alignment: Alignment.center,
          child: Container(
            constraints: const BoxConstraints(maxWidth: 340),
            padding: const EdgeInsets.all(28),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                  blurRadius: 30,
                  offset: const Offset(0, 10),
                ),
              ],
              border: Border.all(
                color: theme.colorScheme.outlineVariant.withValues(alpha: 0.4),
                width: 1.5,
              ),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: gradientColors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: gradientColors.first.withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 5),
                      ),
                    ],
                  ),
                  alignment: Alignment.center,
                  child: Icon(
                    icon,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  title,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.w800,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  description,
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 28),
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: gradientColors,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: gradientColors.first.withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: onResolve,
                      borderRadius: BorderRadius.circular(14),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        child: Center(
                          child: Text(
                            actionText,
                            style: theme.textTheme.titleSmall?.copyWith(
                              color: Colors.white,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.2,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
