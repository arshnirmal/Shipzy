import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart' as geo;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart' as mapbox;

import '../providers/home_provider.dart';
import '../providers/order_provider.dart';
import '../services/location_service.dart';
import '../theme/app_palette.dart';

class MapWidget extends ConsumerStatefulWidget {
  const MapWidget({super.key});

  @override
  ConsumerState<MapWidget> createState() => _MapWidgetState();
}

class _MapWidgetState extends ConsumerState<MapWidget> {
  mapbox.MapboxMap? _mapboxMap;
  mapbox.PointAnnotationManager? _pointAnnotationManager;
  geo.Position? _currentLocation;
  Brightness? _lastBrightness;
  String? _prevTargetKey;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    try {
      final position = await ref.read(locationServiceProvider.notifier).getCurrentLocation();
      if (mounted) {
        setState(() => _currentLocation = position);
        unawaited(_fitCamera());
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
      unawaited(_updateMarkers());
    });

    unawaited(_fitCamera());
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);
    final assignment = ref.watch(activeOrderProvider).valueOrNull;
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

    // Listen to location updates
    ref.listen<AsyncValue<geo.Position>>(locationServiceProvider, (previous, next) {
      final position = next.valueOrNull;
      if (position != null && mounted) {
        setState(() => _currentLocation = position);
        unawaited(_fitCamera());
      }
    });

    if (assignment != null) {
      final targetKey = '${orderState.status.name}_${assignment.assignment.orderId}';
      if (_prevTargetKey != targetKey) {
        _prevTargetKey = targetKey;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            unawaited(_updateMarkers());
            unawaited(_fitCamera());
          }
        });
      }
    }

    return mapbox.MapWidget(
      key: const ValueKey('active_delivery_map'),
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
    );
  }

  Future<void> _updateMarkers() async {
    if (_mapboxMap == null || _pointAnnotationManager == null) {
      return;
    }
    final isDark = Theme.of(context).brightness == Brightness.dark;
    await _pointAnnotationManager?.deleteAll();

    final orderState = ref.read(orderProvider);
    final assignment = ref.read(activeOrderProvider).valueOrNull;

    if (assignment == null) {
      return;
    }

    final isPrePickup = _isPrePickupPhase(orderState.status);
    final isException = _isExceptionPhase(orderState.status);

    final targetAddress = (isPrePickup || isException)
        ? assignment.routing.pickup
        : assignment.routing.delivery;

    if (targetAddress == null) {
      return;
    }

    final label = (isPrePickup || isException) ? 'Pickup' : 'Delivery';
    final pinColor = (isPrePickup || isException)
        ? (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
        : (isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary);

    final annotation = mapbox.PointAnnotationOptions(
      geometry: mapbox.Point(
        coordinates: mapbox.Position(targetAddress.longitude, targetAddress.latitude),
      ),
      textField: label,
      textColor: pinColor.toARGB32(),
      textSize: 12,
      textOffset: [0, 2],
    );

    await _pointAnnotationManager?.create(annotation);
  }

  Future<void> _fitCamera() async {
    if (_mapboxMap == null) {
      return;
    }

    final orderState = ref.read(orderProvider);
    final assignment = ref.read(activeOrderProvider).valueOrNull;

    if (assignment == null) {
      return;
    }

    final isPrePickup = _isPrePickupPhase(orderState.status);
    final isException = _isExceptionPhase(orderState.status);

    final targetAddress = (isPrePickup || isException)
        ? assignment.routing.pickup
        : assignment.routing.delivery;

    if (targetAddress == null) {
      return;
    }

    final points = <mapbox.Point>[
      mapbox.Point(
        coordinates: mapbox.Position(targetAddress.longitude, targetAddress.latitude),
      ),
      if (_currentLocation != null)
        mapbox.Point(
          coordinates: mapbox.Position(
            _currentLocation!.longitude,
            _currentLocation!.latitude,
          ),
        ),
    ];

    final camera = await _mapboxMap?.cameraForCoordinatesPadding(
      points,
      mapbox.CameraOptions(),
      mapbox.MbxEdgeInsets(top: 60, left: 40, bottom: 280, right: 40),
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

  bool _isPrePickupPhase(OrderStatus status) {
    switch (status) {
      case OrderStatus.accepted:
      case OrderStatus.navigatingToPickup:
      case OrderStatus.arrivedAtPickup:
        return true;
      case OrderStatus.idle:
      case OrderStatus.incoming:
      case OrderStatus.pickedUp:
      case OrderStatus.navigatingToDropoff:
      case OrderStatus.arrivedAtDropoff:
      case OrderStatus.delivered:
      case OrderStatus.undeliverable:
      case OrderStatus.returning:
      case OrderStatus.atOrigin:
      case OrderStatus.returned:
      case OrderStatus.completed:
      case OrderStatus.cancelledByCustomer:
        return false;
    }
  }

  bool _isExceptionPhase(OrderStatus status) {
    switch (status) {
      case OrderStatus.undeliverable:
      case OrderStatus.returning:
      case OrderStatus.atOrigin:
      case OrderStatus.returned:
        return true;
      case OrderStatus.idle:
      case OrderStatus.incoming:
      case OrderStatus.accepted:
      case OrderStatus.navigatingToPickup:
      case OrderStatus.arrivedAtPickup:
      case OrderStatus.pickedUp:
      case OrderStatus.navigatingToDropoff:
      case OrderStatus.arrivedAtDropoff:
      case OrderStatus.delivered:
      case OrderStatus.completed:
      case OrderStatus.cancelledByCustomer:
        return false;
    }
  }
}
