import 'dart:async';

import 'package:riverpod/riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/daily_stats.dart';
import '../models/driver_dashboard_data.dart';
import '../models/driver_home_state.dart';
import '../models/driver_profile.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';

part 'home_provider.g.dart';

@riverpod
class DriverHome extends _$DriverHome {
  Timer? _pollingTimer;

  @override
  DriverHomeState build() {
    // Keep driver status in sync with backend profile & active order on startup
    final profileAsync = ref.watch(driverProfileProvider);
    final activeOrderAsync = ref.watch(activeOrderProvider);

    // Default values
    var initialStatus = DriverStatus.offline;
    String? initialError;

    // 1. Try to sync with backend profile status (three states)
    if (profileAsync.hasValue) {
      final profile = profileAsync.value!;
      final status = profile.status;
      if (status != null) {
        if (status.isOnline && status.isAvailable) {
          initialStatus = DriverStatus.online;
        } else if (status.isOnline && !status.isAvailable) {
          initialStatus = DriverStatus.onDelivery; // in-transit
        } else {
          initialStatus = DriverStatus.offline;
        }
      }
    }

    // 2. Override if there's an active order
    if (activeOrderAsync.hasValue) {
      final order = activeOrderAsync.value;
      if (order != null) {
        initialStatus = DriverStatus.onDelivery;
      }
    }

    // Return the calculated state
    return DriverHomeState(status: initialStatus, error: initialError);
  }

  Future<void> toggleStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final newStatus = state.status == DriverStatus.offline ? DriverStatus.online : DriverStatus.offline;
      final isGoingOnline = newStatus == DriverStatus.online;

      // Fetch current location when going online/offline
      Map<String, double>? location;
      try {
        final position = await ref.read(locationServiceProvider.future);
        location = {'latitude': position.latitude, 'longitude': position.longitude};
      } catch (e) {
        // If location fails, continue without it (graceful degradation)
        // Backend will still work, just won't update lastActiveLocation
      }

      // Call API to update status with location
      await ref.read(apiServiceProvider).updateDriverAvailability(isAvailable: isGoingOnline, isOnline: isGoingOnline, location: location);

      state = state.copyWith(status: newStatus, isLoading: false, error: null);

      if (isGoingOnline) {
        _startPolling();
        // Refresh nearby orders when going online
        ref.invalidate(nearbyOrdersProvider);
      } else {
        _stopPolling();
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    // Note: nearbyOrdersProvider will refresh automatically when status changes
    // due to its dependency on driverHomeProvider, but we don't need to invalidate it here
    // to avoid circular dependencies
  }

  void _stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> acceptOrder(int orderId) async {
    try {
      await ref.read(apiServiceProvider).acceptOrder(orderId);
      // Refresh active order and available orders
      ref.invalidate(activeOrderProvider);
      ref.invalidate(driverDashboardDataProvider);
      ref.invalidate(driverProfileProvider);
      ref.invalidate(nearbyOrdersProvider);

      state = state.copyWith(status: DriverStatus.onDelivery);
    } catch (e) {
      state = state.copyWith(error: 'Failed to accept order: $e');
    }
  }

  Future<void> rejectOrder(int orderId) async {
    // For now, just invalidate the list to refresh
    // In a real app, we'd probably want to add it to a "ignored" list locally
    ref.invalidate(nearbyOrdersProvider);
  }
}

@riverpod
Future<DailyStats> dailyStats(Ref ref) async {
  // Get daily stats from driver profile to avoid extra API call
  final driverProfile = await ref.watch(driverProfileProvider.future);
  return DailyStats(
    earnings: (driverProfile.earnings?.today ?? 0).toDouble(),
    trips: driverProfile.status?.totalDeliveriesToday ?? 0,
    weeklyEarnings: (driverProfile.earnings?.thisWeek ?? 0).toDouble(),
    totalEarnings: (driverProfile.earnings?.total ?? 0).toDouble(),
  );
}

@riverpod
DriverStatus driverStatus(Ref ref) {
  // Separate provider for driver status to avoid circular dependencies
  return ref.watch(driverHomeProvider).status;
}

@riverpod
Future<List<AvailableOrder>> nearbyOrders(Ref ref) async {
  // Watch driver status from separate provider to avoid circular dependency
  final driverStatus = ref.watch(driverStatusProvider);
  if (driverStatus != DriverStatus.online) {
    return []; // Return empty list when offline
  }

  // Add small delay to prioritize other API calls
  await Future.delayed(const Duration(milliseconds: 500));

  // Use current location once (stream can hang waiting for first emit)
  final locationService = ref.read(locationServiceProvider.notifier);
  try {
    final position = await locationService.getCurrentLocation();
    final apiService = ref.read(apiServiceProvider);
    return apiService.getAvailableOrders(latitude: position.latitude, longitude: position.longitude);
  } catch (e) {
    // If location is unavailable, return empty list to avoid perpetual loading
    return [];
  }
}

@riverpod
Future<DriverDashboardData> driverDashboardData(Ref ref) async {
  final apiService = ref.read(apiServiceProvider);

  // Fetch both profile and assignments in parallel to reduce total API calls
  final results = await Future.wait([apiService.getDriverProfile(), apiService.getActiveOrder()]);

  final profile = results[0] as DriverProfile;
  final activeOrder = results[1] as ActiveOrder?;

  return DriverDashboardData(profile: profile, activeOrder: activeOrder);
}

@riverpod
Future<ActiveOrder?> activeOrder(Ref ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.activeOrder;
}

@riverpod
Future<DriverProfile> driverProfile(Ref ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.profile;
}
