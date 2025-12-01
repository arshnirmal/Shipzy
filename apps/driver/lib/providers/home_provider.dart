import 'dart:async';

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/daily_stats.dart';
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

      // Call API to update status
      await ref
          .read(apiServiceProvider)
          .updateDriverAvailability(isAvailable: newStatus == DriverStatus.online, isOnline: newStatus == DriverStatus.online);

      state = state.copyWith(status: newStatus, isLoading: false, error: null);

      if (newStatus == DriverStatus.online) {
        _startPolling();
      } else {
        _stopPolling();
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      ref.invalidate(nearbyOrdersProvider);
    });
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
  final apiService = ref.read(apiServiceProvider);
  return apiService.getDailyStats();
}

@riverpod
Future<List<AvailableOrder>> nearbyOrders(NearbyOrdersRef ref) async {
  final location = await ref.read(locationServiceProvider.future);
  final apiService = ref.read(apiServiceProvider);
  return apiService.getAvailableOrders(latitude: location.latitude, longitude: location.longitude);
}

@riverpod
Future<ActiveOrder?> activeOrder(ActiveOrderRef ref) async {
  final apiService = ref.read(apiServiceProvider);
  return apiService.getActiveOrder();
}

@riverpod
Future<DriverProfile> driverProfile(DriverProfileRef ref) async {
  final apiService = ref.read(apiServiceProvider);
  return apiService.getDriverProfile();
}
