import 'dart:async';

import 'package:battery_plus/battery_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/active_order.dart';
import '../models/available_order.dart';
import '../models/daily_stats.dart';
import '../models/driver_home_state.dart';
import '../models/driver_profile.dart';
import '../models/location_meta.dart';
import '../services/api_service.dart';
import '../services/local_notification_service.dart';
import '../services/location_service.dart';
import '../services/notification_service.dart';

part 'home_provider.g.dart';

// Exposes current battery level (0–100). Updated every 2 minutes while app is active.
final batteryLevelProvider = StateProvider<int>((ref) => 100);

@riverpod
class DriverHome extends _$DriverHome {
  Timer? _pollingTimer;
  Timer? _idleTimer;
  Timer? _batteryTimer;
  bool _lowBatteryWarningShown = false;
  bool _criticalBatteryHandled = false;
  final Battery _battery = Battery();

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

    _startBatteryMonitor();

    ref.onDispose(() {
      _idleTimer?.cancel();
      _batteryTimer?.cancel();
      _pollingTimer?.cancel();
    });

    return DriverHomeState(status: initialStatus, error: initialError);
  }

  Future<void> toggleStatus() async {
    state = state.copyWith(isLoading: true);
    try {
      final newStatus = state.status == DriverStatus.offline ? DriverStatus.online : DriverStatus.offline;
      final isGoingOnline = newStatus == DriverStatus.online;

      // Fetch current location when going online/offline
      Position? currentPosition;
      Map<String, double>? location;
      try {
        currentPosition = await ref.read(locationServiceProvider.notifier).getCurrentLocation();
        location = {'latitude': currentPosition.latitude, 'longitude': currentPosition.longitude};
      } catch (e) {
        // If location fails, continue without it (graceful degradation)
      }

      await ref.read(apiServiceProvider).updateDriverAvailability(isAvailable: isGoingOnline, isOnline: isGoingOnline, location: location);

      if (currentPosition != null) {
        await ref
            .read(apiServiceProvider)
            .updateDriverLocation(
              latitude: currentPosition.latitude,
              longitude: currentPosition.longitude,
              locationMeta: _buildLocationMeta(currentPosition),
            );
      }

      state = state.copyWith(status: newStatus, isLoading: false, error: null);

      if (isGoingOnline) {
        _startIdleTimer();
        ref.invalidate(nearbyOrdersProvider);
      } else {
        _idleTimer?.cancel();
        _idleTimer = null;
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

  // Plan §6: starts 30-min idle countdown while driver is online with no active delivery.
  void _startIdleTimer() {
    _idleTimer?.cancel();
    _idleTimer = Timer(const Duration(minutes: 30), () {
      unawaited(ref.read(localNotificationServiceProvider).showIdleDutyPrompt());
    });
  }

  // Resets idle timer on any order interaction (accept, reject).
  void _resetIdleTimer() {
    if (state.status == DriverStatus.online) {
      _startIdleTimer();
    } else {
      _idleTimer?.cancel();
      _idleTimer = null;
    }
  }

  // Polls battery every 2 minutes. Idempotent — safe to call from build().
  void _startBatteryMonitor() {
    if (_batteryTimer != null) {
      return;
    }
    _batteryTimer = Timer.periodic(const Duration(minutes: 2), (_) => unawaited(_checkBattery()));
    unawaited(_checkBattery());
  }

  // Plan §6: <15% → warning notification; <5% → auto-offline + notification.
  Future<void> _checkBattery() async {
    try {
      final level = await _battery.batteryLevel;
      final batteryState = await _battery.batteryState;

      // Skip warnings when plugged in
      if (batteryState == BatteryState.charging || batteryState == BatteryState.full) {
        _lowBatteryWarningShown = false;
        _criticalBatteryHandled = false;
        return;
      }

      ref.read(batteryLevelProvider.notifier).state = level;

      if (level < 5 && !_criticalBatteryHandled) {
        _criticalBatteryHandled = true;
        if (state.status != DriverStatus.offline) {
          await toggleStatus();
        }
        await ref.read(localNotificationServiceProvider).showLowBatteryWarning(level);
      } else if (level < 15 && !_lowBatteryWarningShown) {
        _lowBatteryWarningShown = true;
        await ref.read(localNotificationServiceProvider).showLowBatteryWarning(level);
      } else if (level >= 15) {
        _lowBatteryWarningShown = false;
        _criticalBatteryHandled = false;
      }
    } catch (_) {
      // Battery check failed — skip tick
    }
  }

  Future<void> acceptOrder(int orderId) async {
    try {
      await ref.read(apiServiceProvider).acceptOrder(orderId);
      ref.invalidate(activeOrderProvider);
      ref.invalidate(driverProfileProvider);
      ref.invalidate(nearbyOrdersProvider);

      _idleTimer?.cancel();
      _idleTimer = null;
      state = state.copyWith(status: DriverStatus.onDelivery);
    } catch (e) {
      state = state.copyWith(error: 'Failed to accept order: $e');
    }
  }

  Future<void> rejectOrder(int orderId) async {
    _resetIdleTimer();
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

  // Re-fetch when FCM signals a new available order
  ref.watch(availableOrdersRefreshSignalProvider);

  await Future.delayed(const Duration(milliseconds: 500));

  final locationService = ref.read(locationServiceProvider.notifier);
  try {
    final position = await locationService.getCurrentLocation();
    return ref.read(apiServiceProvider).getAvailableOrders(latitude: position.latitude, longitude: position.longitude);
  } catch (e) {
    return [];
  }
}

@riverpod
Future<DriverProfile> driverProfile(Ref ref) => ref.read(apiServiceProvider).getDriverProfile();

/// Active courier assignment from the API. Skips the network when the profile
/// is not verified (onboarding / pending review), since assignments apply only
/// to approved couriers.
@riverpod
Future<ActiveAssignment?> activeOrder(Ref ref) async {
  final profile = await ref.watch(driverProfileProvider.future);
  if (!profile.isVerified) {
    return null;
  }
  return ref.read(apiServiceProvider).getActiveOrder();
}

final tripHistoryProvider = FutureProvider.autoDispose<List<Map<String, dynamic>>>((ref) async {
  final data = await ref.read(apiServiceProvider).getTripHistory();
  final trips = data['trips'];
  if (trips is List) {
    return trips.cast<Map<String, dynamic>>();
  }
  return [];
});

LocationMeta _buildLocationMeta(Position position) {
  final speed = position.speed;
  final heading = position.heading;
  final accuracy = position.accuracy;

  final speedKmph = speed.isFinite && speed >= 0 ? speed * 3.6 : null;
  final bearing = heading.isFinite && heading >= 0 && heading <= 360 ? heading : null;
  final safeAccuracy = accuracy.isFinite && accuracy >= 0 ? accuracy : null;

  return LocationMeta(speed: speedKmph, bearing: bearing, accuracy: safeAccuracy);
}
