// lib/providers/location_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:riverpod/riverpod.dart';

import '../models/saved_address.dart';

// Location permission status
final locationPermissionProvider = FutureProvider<LocationPermission>((ref) async => Geolocator.checkPermission());

// Location service status
final locationServiceProvider = FutureProvider<bool>((ref) async => Geolocator.isLocationServiceEnabled());

// Current device location provider
final currentLocationProvider = FutureProvider<Position?>((ref) async {
  // Check if location services are enabled
  final serviceEnabled = await Geolocator.isLocationServiceEnabled();
  if (!serviceEnabled) {
    return null;
  }

  // Check permission
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
  try {
    return await Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)),
    );
  } catch (e) {
    return null;
  }
});

// Reverse geocode to get address from coordinates
final addressFromCoordinatesProvider = FutureProvider.family<String?, Position>((ref, position) async {
  try {
    final placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);

    if (placemarks.isEmpty) {
      return null;
    }

    final place = placemarks.first;

    // Format address similar to your image: "804, Bldg no.6, Man Opus..."
    final parts = <String>[];

    if (place.subThoroughfare != null && place.subThoroughfare!.isNotEmpty) {
      parts.add(place.subThoroughfare!);
    }
    if (place.thoroughfare != null && place.thoroughfare!.isNotEmpty) {
      parts.add(place.thoroughfare!);
    }
    if (place.subLocality != null && place.subLocality!.isNotEmpty) {
      parts.add(place.subLocality!);
    }
    if (place.locality != null && place.locality!.isNotEmpty) {
      parts.add(place.locality!);
    }

    return parts.join(', ');
  } catch (e) {
    return 'Current Location';
  }
});

// Location state notifier for managing location operations
class LocationNotifier extends Notifier<AsyncValue<SavedAddress?>> {
  @override
  AsyncValue<SavedAddress?> build() {
    _initializeLocation();
    return const AsyncValue.loading();
  }

  Future<void> _initializeLocation() async {
    try {
      // First, try to get current location
      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.high, timeLimit: Duration(seconds: 10)),
      );

      final address = await _getAddressFromPosition(position);

      state = AsyncValue.data(
        SavedAddress(
          addressId: 0, // Current location has ID 0
          label: 'Current Location',
          fullAddress: address,
          city: '',
          state: '',
          postalCode: '',
          latitude: position.latitude,
          longitude: position.longitude,
          addressType: 'current',
          createdAt: DateTime.now(),
        ),
      );
    } catch (e) {
      // If location fails, set to null (will fallback to saved addresses)
      state = const AsyncValue.data(null);
    }
  }

  Future<String> _getAddressFromPosition(Position position) async {
    try {
      final placemarks = await placemarkFromCoordinates(position.latitude, position.longitude);

      if (placemarks.isEmpty) {
        return 'Current Location';
      }

      final place = placemarks.first;
      final parts = <String>[];

      if (place.subThoroughfare != null && place.subThoroughfare!.isNotEmpty) {
        parts.add(place.subThoroughfare!);
      }
      if (place.thoroughfare != null && place.thoroughfare!.isNotEmpty) {
        parts.add(place.thoroughfare!);
      }
      if (place.subLocality != null && place.subLocality!.isNotEmpty) {
        parts.add(place.subLocality!);
      }
      if (place.locality != null && place.locality!.isNotEmpty) {
        parts.add(place.locality!);
      }

      return parts.isNotEmpty ? parts.join(', ') : 'Current Location';
    } catch (e) {
      return 'Current Location';
    }
  }

  Future<void> requestLocationPermission() async {
    final permission = await Geolocator.requestPermission();
    if (permission == LocationPermission.whileInUse || permission == LocationPermission.always) {
      await _initializeLocation();
    }
  }

  Future<void> refreshLocation() async {
    state = const AsyncValue.loading();
    await _initializeLocation();
  }

  void selectAddress(SavedAddress address) {
    state = AsyncValue.data(address);
  }
}

final locationNotifierProvider = NotifierProvider<LocationNotifier, AsyncValue<SavedAddress?>>(LocationNotifier.new);
