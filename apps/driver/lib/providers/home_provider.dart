import 'dart:async';

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
    // Initialize with offline state
    // In a real app, we would check the persisted state or fetch from API
    return const DriverHomeState();
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

  Future<void> acceptOrder(String orderId) async {
    try {
      await ref.read(apiServiceProvider).acceptOrder(orderId);
      // Refresh active order and available orders
      ref.invalidate(activeOrderProvider);
      ref.invalidate(nearbyOrdersProvider);

      state = state.copyWith(status: DriverStatus.onDelivery);
    } catch (e) {
      state = state.copyWith(error: 'Failed to accept order: $e');
    }
  }

  Future<void> rejectOrder(String orderId) async {
    // For now, just invalidate the list to refresh
    // In a real app, we'd probably want to add it to a "ignored" list locally
    ref.invalidate(nearbyOrdersProvider);
  }
}

@riverpod
Future<DailyStats> dailyStats(DailyStatsRef ref) async {
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
DriverStatus driverStatus(DriverStatusRef ref) {
  // Separate provider for driver status to avoid circular dependencies
  return ref.watch(driverHomeProvider).status;
}

@riverpod
Future<List<AvailableOrder>> nearbyOrders(NearbyOrdersRef ref) async {
  // Watch driver status from separate provider to avoid circular dependency
  final driverStatus = ref.watch(driverStatusProvider);
  if (driverStatus != DriverStatus.online) {
    return []; // Return empty list when offline
  }

  // Add small delay to prioritize other API calls
  await Future.delayed(const Duration(milliseconds: 500));

  final location = await ref.read(locationServiceProvider.future);
  final apiService = ref.read(apiServiceProvider);
  return apiService.getAvailableOrders(latitude: location.latitude, longitude: location.longitude);
}

@riverpod
Future<DriverDashboardData> driverDashboardData(DriverDashboardDataRef ref) async {
  final apiService = ref.read(apiServiceProvider);

  // Fetch both profile and assignments in parallel to reduce total API calls
  final results = await Future.wait([apiService.getDriverProfile(), apiService.getActiveOrder()]);

  final profile = results[0] as DriverProfile;
  final activeOrder = results[1] as ActiveOrder?;

  return DriverDashboardData(profile: profile, activeOrder: activeOrder);
}

@riverpod
Future<ActiveOrder?> activeOrder(ActiveOrderRef ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.activeOrder;
}

@riverpod
Future<DriverProfile> driverProfile(DriverProfileRef ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.profile;
}
