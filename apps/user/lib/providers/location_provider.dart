// lib/providers/location_provider.dart

import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'location_provider.g.dart';

@riverpod
class UserLocation extends _$UserLocation {
  @override
  Future<LocationData?> build() async => _getCurrentLocation();

  Future<LocationData?> _getCurrentLocation() async {
    try {
      // Check if location services are enabled
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      // Check permissions
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);

      // Reverse geocode to get address
      final placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);

      final placemark = placemarks.firstOrNull;
      return LocationData(
        latitude: position.latitude,
        longitude: position.longitude,
        city: placemark?.locality ?? '',
        state: placemark?.administrativeArea ?? '',
        country: placemark?.country ?? '',
        formattedAddress: '${placemark?.locality ?? ''}, ${placemark?.administrativeArea ?? ''}',
      );
    } catch (e) {
      return null;
    }
  }

  /// Refresh location

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async => _getCurrentLocation());
  }
}

/// Location data model

class LocationData {
  const LocationData({
    required this.latitude,
    required this.longitude,
    required this.city,
    required this.state,
    required this.country,
    required this.formattedAddress,
  });

  final double latitude;
  final double longitude;
  final String city;
  final String state;
  final String country;
  final String formattedAddress;
}
