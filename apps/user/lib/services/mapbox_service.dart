import 'dart:typed_data';

import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:geolocator/geolocator.dart' as geolocator;
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class MapboxService {
  static String get accessToken => dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '';

  // Get current location
  Future<geolocator.Position> getCurrentLocation() async {
    final serviceEnabled =
        await geolocator.Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    var permission = await geolocator.Geolocator.checkPermission();
    if (permission == geolocator.LocationPermission.denied) {
      permission = await geolocator.Geolocator.requestPermission();
      if (permission == geolocator.LocationPermission.denied) {
        throw Exception('Location permissions are denied');
      }
    }

    if (permission == geolocator.LocationPermission.deniedForever) {
      throw Exception('Location permissions are permanently denied');
    }

    return geolocator.Geolocator.getCurrentPosition();
  }

  // Create camera position
  CameraOptions createCameraOptions({
    required double latitude,
    required double longitude,
    double zoom = 14.0,
  }) => CameraOptions(
    center: Point(coordinates: Position(longitude, latitude)),
    zoom: zoom,
  );

  // Add marker
  Future<void> addMarker({
    required MapboxMap mapboxMap,
    required double latitude,
    required double longitude,
    String? imageName,
  }) async {
    await mapboxMap.annotations.createPointAnnotationManager().then((manager) {
      manager.create(
        PointAnnotationOptions(
          geometry: Point(coordinates: Position(longitude, latitude)),
          image: imageName != null ? imageName.codeUnits as Uint8List? : null,
        ),
      );
    });
  }
}
