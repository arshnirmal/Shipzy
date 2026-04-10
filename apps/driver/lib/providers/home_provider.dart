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
    // Keep driver status in sync with backend profile & active assignment on startup
    final profileAsync = ref.watch(driverProfileProvider);
    final activeAssignmentAsync = ref.watch(activeOrderProvider);

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

    // 2. Override if there's an active assignment
    if (activeAssignmentAsync.hasValue) {
      final assignment = activeAssignmentAsync.value;
      if (assignment != null) {
        initialStatus = DriverStatus.onDelivery;
      }
    }

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
      }

      await ref.read(apiServiceProvider).updateDriverAvailability(
            isAvailable: isGoingOnline,
            isOnline: isGoingOnline,
            location: location,
          );

      state = state.copyWith(status: newStatus, isLoading: false, error: null);

      if (isGoingOnline) {
        ref.invalidate(nearbyOrdersProvider);
      } else {
        _stopPolling();
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> acceptOrder(int orderId) async {
    try {
      await ref.read(apiServiceProvider).acceptOrder(orderId);
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
    ref.invalidate(nearbyOrdersProvider);
  }
}

@riverpod
Future<DailyStats> dailyStats(Ref ref) async {
  final driverProfile = await ref.watch(driverProfileProvider.future);
  return DailyStats(
    earnings: (driverProfile.earnings?.today ?? 0).toDouble(),
    trips: driverProfile.status?.totalDeliveriesToday ?? 0,
    weeklyEarnings: (driverProfile.earnings?.thisWeek ?? 0).toDouble(),
    totalEarnings: (driverProfile.earnings?.total ?? 0).toDouble(),
  );
}

@riverpod
DriverStatus driverStatus(Ref ref) => ref.watch(driverHomeProvider).status;

@riverpod
Future<List<AvailableOrderItem>> nearbyOrders(Ref ref) async {
  final status = ref.watch(driverStatusProvider);
  if (status != DriverStatus.online) {
    return [];
  }

  await Future.delayed(const Duration(milliseconds: 500));

  final locationService = ref.read(locationServiceProvider.notifier);
  try {
    final position = await locationService.getCurrentLocation();
    return ref.read(apiServiceProvider).getAvailableOrders(
          latitude: position.latitude,
          longitude: position.longitude,
        );
  } catch (e) {
    return [];
  }
}

@riverpod
Future<DriverDashboardData> driverDashboardData(Ref ref) async {
  final apiService = ref.read(apiServiceProvider);

  final results = await Future.wait([apiService.getDriverProfile(), apiService.getActiveOrder()]);

  final profile = results[0] as DriverProfile;
  final activeAssignment = results[1] as ActiveAssignment?;

  return DriverDashboardData(profile: profile, activeAssignment: activeAssignment);
}

@riverpod
Future<ActiveAssignment?> activeOrder(Ref ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.activeAssignment;
}

@riverpod
Future<DriverProfile> driverProfile(Ref ref) async {
  final dashboardData = await ref.watch(driverDashboardDataProvider.future);
  return dashboardData.profile;
}
