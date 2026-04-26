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

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  mapbox.MapboxMap? _mapboxMap;
  mapbox.PointAnnotationManager? _pointAnnotationManager;
  geo.Position? _currentLocation;
  Brightness? _lastBrightness;
  // Guards camera refits: only fires when trip state changes, not every rebuild.
  bool? _prevHasActiveTrip;

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

    // Only refit camera when trip state transitions, not on every rebuild.
    if (_prevHasActiveTrip != hasActiveTrip) {
      _prevHasActiveTrip = hasActiveTrip;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted || _mapboxMap == null) {
          return;
        }
        if (hasActiveTrip) {
          _fitCameraToOrder();
        } else {
          _updateCamera();
        }
      });
    }

    // Estimate height for FAB offset above bottom card
    final fabBottomOffset = hasActiveTrip
        ? 296.0
        : hasIncomingRequest
            ? 348.0
            : 72.0;

    ref.listen(activeOrderProvider, (previous, next) {
      if (next.hasValue && next.value != null) {
        _updateMarkers();
      } else if (next.value == null) {
        _pointAnnotationManager?.deleteAll();
      }
    });

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
              if (status == DriverStatus.offline) const _OfflineOverlay(),

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
    if (activeOrder == null) {
      return;
    }

    final pickup = activeOrder.routing.pickup;
    final delivery = activeOrder.routing.delivery;

    final annotations = <mapbox.PointAnnotationOptions>[
      if (pickup != null)
        mapbox.PointAnnotationOptions(
          geometry: mapbox.Point(
            coordinates: mapbox.Position(pickup.longitude, pickup.latitude),
          ),
          textField: 'Pickup',
          textColor:
              (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
                  .toARGB32(),
          textSize: 12,
          textOffset: [0, 2],
        ),
      if (delivery != null)
        mapbox.PointAnnotationOptions(
          geometry: mapbox.Point(
            coordinates: mapbox.Position(
              delivery.longitude,
              delivery.latitude,
            ),
          ),
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
    if (activeOrder == null) {
      return;
    }

    final pickup = activeOrder.routing.pickup;
    final delivery = activeOrder.routing.delivery;

    final points = <mapbox.Point>[
      if (pickup != null)
        mapbox.Point(
          coordinates: mapbox.Position(pickup.longitude, pickup.latitude),
        ),
      if (delivery != null)
        mapbox.Point(
          coordinates: mapbox.Position(
            delivery.longitude,
            delivery.latitude,
          ),
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
      mapbox.MbxEdgeInsets(top: 60, left: 40, bottom: 320, right: 40),
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
