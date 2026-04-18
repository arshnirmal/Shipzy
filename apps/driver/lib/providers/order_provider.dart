import 'dart:async';

import 'package:geolocator/geolocator.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/arrive_result.dart';
import '../models/delivery_attempt.dart';
import '../models/location_meta.dart';
import '../models/order_types.dart';
import '../services/api_service.dart';
import '../services/foreground_task_service.dart';
import '../services/local_notification_service.dart';
import '../services/location_queue.dart';
import '../services/location_service.dart';
import '../services/notification_service.dart';

part 'order_provider.g.dart';

@riverpod
class Order extends _$Order {
  Timer? _waitTimer;
  Timer? _locationTimer;
  bool _isLocationSyncInFlight = false;
  var _isDisposed = false;

  ForegroundTaskService get _foregroundTask => ref.read(foregroundTaskServiceProvider);

  @override
  OrderState build() {
    _isDisposed = false;

    ref.onDispose(() {
      _isDisposed = true;
      _waitTimer?.cancel();
      _stopLocationTimer();
    });

    // When FCM signals an order cancellation, clear the active flow.
    ref.listen(orderCancelledSignalProvider, (_, __) {
      if (state.activeOrderId != null) {
        _waitTimer?.cancel();
        _stopLocationTimer();
        unawaited(_foregroundTask.stop());
        state = const OrderState();
      }
    });

    unawaited(_restoreActiveOrderState());
    return const OrderState();
  }

  Future<void> acceptOrder(String orderId) async {
    await ref.read(apiServiceProvider).acceptOrder(_parseOrderId(orderId));
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.accepted, waitUntil: null, waitElapsed: false));
  }

  Future<void> rejectOrder(String orderId) async {
    // Reject endpoint is not part of current backend flow; keep local no-op transition.
  }

  Future<void> startNavigation(String orderId) async {
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.navigatingToPickup));
  }

  Future<void> arriveAtPickup(String orderId) async {
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.arrivedAtPickup));
  }

  Future<void> confirmPickup(String orderId) async {
    await ref.read(apiServiceProvider).updateOrderStatus(_parseOrderId(orderId), AssignmentOrderStatus.pickedUp);
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.pickedUp));
  }

  Future<void> startDropoffNavigation(String orderId) async {
    await ref.read(apiServiceProvider).updateOrderStatus(_parseOrderId(orderId), AssignmentOrderStatus.inTransit);
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.navigatingToDropoff));
  }

  Future<void> arriveAtDelivery(String orderId) async {
    final position = await ref.read(locationServiceProvider.notifier).getCurrentLocation();
    final result = await ref.read(apiServiceProvider).arriveAtDelivery(_parseOrderId(orderId), lat: position.latitude, lng: position.longitude);

    final waitElapsed = DateTime.now().isAfter(result.waitUntil);
    _setState(state.copyWith(activeOrderId: orderId, status: OrderStatus.arrivedAtDropoff, waitUntil: result.waitUntil, waitElapsed: waitElapsed));

    _startWaitTimer();
  }

  Future<void> submitUndeliverable(String orderId, {required String note, String? photoUrl}) async {
    try {
      await ref.read(apiServiceProvider).markUndeliverable(_parseOrderId(orderId), driverNote: note, photoUrl: photoUrl);
      _waitTimer?.cancel();
      _setState(state.copyWith(status: OrderStatus.undeliverable));
    } on RetryAfterException catch (e) {
      _setState(state.copyWith(waitUntil: e.retryAfter, waitElapsed: false));
      _startWaitTimer();
      rethrow;
    }
  }

  Future<void> startReturn(String orderId) async {
    await ref.read(apiServiceProvider).startReturn(_parseOrderId(orderId));
    _setState(state.copyWith(status: OrderStatus.returning));
  }

  Future<void> confirmReturned(String orderId) async {
    await ref.read(apiServiceProvider).confirmReturned(_parseOrderId(orderId));
    _waitTimer?.cancel();
    _setState(state.copyWith(status: OrderStatus.returned, activeOrderId: null, waitUntil: null, waitElapsed: false));
  }

  Future<void> submitProofOfDelivery(
    String orderId, {
    String? recipientName,
    String? photoUrl,
    String? recipientSignatureUrl,
    String? deliveryNotes,
  }) async {
    await ref
        .read(apiServiceProvider)
        .submitProofOfDelivery(
          _parseOrderId(orderId),
          recipientName: recipientName,
          photoUrl: photoUrl,
          recipientSignatureUrl: recipientSignatureUrl,
          deliveryNotes: deliveryNotes,
        );
  }

  Future<void> completeDelivery(String orderId) async {
    await ref.read(apiServiceProvider).updateOrderStatus(_parseOrderId(orderId), AssignmentOrderStatus.delivered);
    _waitTimer?.cancel();
    _setState(state.copyWith(status: OrderStatus.delivered, waitUntil: null, waitElapsed: false));
  }

  void closeActiveOrderFlow() {
    _waitTimer?.cancel();
    _setState(const OrderState());
  }

  void _setState(OrderState nextState) {
    state = nextState;
    _syncLocationTimer();
  }

  void _startWaitTimer() {
    _waitTimer?.cancel();
    final waitUntil = state.waitUntil;
    if (waitUntil == null) {
      return;
    }

    if (DateTime.now().isAfter(waitUntil)) {
      _setState(state.copyWith(waitElapsed: true));
      unawaited(ref.read(localNotificationServiceProvider).showWaitTimerElapsed());
      return;
    }

    _waitTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      final currentWaitUntil = state.waitUntil;
      if (currentWaitUntil == null) {
        timer.cancel();
        return;
      }

      if (DateTime.now().isAfter(currentWaitUntil)) {
        timer.cancel();
        _setState(state.copyWith(waitElapsed: true));
        unawaited(ref.read(localNotificationServiceProvider).showWaitTimerElapsed());
      }
    });
  }

  bool _shouldTrackLocation(OrderStatus status) {
    switch (status) {
      case OrderStatus.pickedUp:
      case OrderStatus.navigatingToDropoff:
      case OrderStatus.arrivedAtDropoff:
      case OrderStatus.undeliverable:
      case OrderStatus.returning:
        return true;
      case OrderStatus.idle:
      case OrderStatus.accepted:
      case OrderStatus.navigatingToPickup:
      case OrderStatus.arrivedAtPickup:
      case OrderStatus.delivered:
      case OrderStatus.returned:
        return false;
    }
  }

  void _syncLocationTimer() {
    if (_shouldTrackLocation(state.status)) {
      _startLocationTimer();
      unawaited(_foregroundTask.start());
    } else {
      _stopLocationTimer();
      unawaited(_foregroundTask.stop());
    }
  }

  void _startLocationTimer() {
    if (_locationTimer != null) {
      return;
    }

    _locationTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      unawaited(_pushLocationUpdate());
    });

    unawaited(_pushLocationUpdate());
  }

  Future<void> _pushLocationUpdate() async {
    if (_isLocationSyncInFlight || !_shouldTrackLocation(state.status)) {
      return;
    }

    _isLocationSyncInFlight = true;
    try {
      final position = await Geolocator.getCurrentPosition();
      if (_isDisposed) {
        return;
      }

      final meta = _buildLocationMeta(position);
      final apiService = ref.read(apiServiceProvider);

      try {
        await apiService.updateDriverLocation(latitude: position.latitude, longitude: position.longitude, locationMeta: meta);
        await _drainQueue(apiService);
      } catch (_) {
        await _enqueuePosition(position.latitude, position.longitude, meta);
      }
    } catch (_) {
      // GPS failure — next tick retries automatically.
    } finally {
      _isLocationSyncInFlight = false;
    }
  }

  // Plan §9: on reconnect, flush the single most-recent queued position only.
  // All queued entries become stale once the latest is sent.
  Future<void> _drainQueue(ApiService apiService) async {
    try {
      final queue = await ref.read(locationQueueProvider.future);
      final entries = await queue.peekLatest(1);
      if (entries.isEmpty || _isDisposed) {
        return;
      }
      try {
        final entry = entries.first;
        await apiService.updateDriverLocation(
          latitude: entry.latitude,
          longitude: entry.longitude,
          locationMeta: LocationMeta(speed: entry.speed, bearing: entry.bearing, accuracy: entry.accuracy),
        );
        await queue.clear();
      } catch (_) {
        // Still offline — queue remains for next tick
      }
    } catch (_) {
      // Queue unavailable — skip drain
    }
  }

  Future<void> _enqueuePosition(double latitude, double longitude, LocationMeta meta) async {
    try {
      final queue = await ref.read(locationQueueProvider.future);
      await queue.enqueue(latitude: latitude, longitude: longitude, speed: meta.speed, bearing: meta.bearing, accuracy: meta.accuracy);
    } catch (_) {
      // Queue unavailable — skip enqueue
    }
  }

  LocationMeta _buildLocationMeta(Position position) {
    final speed = position.speed;
    final heading = position.heading;
    final accuracy = position.accuracy;

    final speedKmph = speed.isFinite && speed >= 0 ? speed * 3.6 : null;
    final bearing = heading.isFinite && heading >= 0 && heading <= 360 ? heading : null;
    final safeAccuracy = accuracy.isFinite && accuracy >= 0 ? accuracy : null;

    return LocationMeta(speed: speedKmph, bearing: bearing, accuracy: safeAccuracy);
  }

  void _stopLocationTimer() {
    _locationTimer?.cancel();
    _locationTimer = null;
  }

  int _parseOrderId(String orderId) {
    final parsed = int.tryParse(orderId);
    if (parsed == null) {
      throw FormatException('Invalid order id: $orderId');
    }
    return parsed;
  }

  Future<void> _restoreActiveOrderState() async {
    try {
      final apiService = ref.read(apiServiceProvider);
      final activeAssignment = await apiService.getActiveOrder();
      if (_isDisposed || activeAssignment == null) {
        return;
      }

      final orderId = activeAssignment.assignment.orderId.toString();
      var status = _statusFromAssignment(activeAssignment.assignmentStatus.order);
      DateTime? waitUntil;
      var waitElapsed = false;

      if (status == OrderStatus.navigatingToDropoff) {
        final attempt = activeAssignment.deliveryAttempt ?? await apiService.getDeliveryAttempt(activeAssignment.assignment.orderId);
        if (_isDisposed) {
          return;
        }

        if (attempt?.arrivedAt != null) {
          status = OrderStatus.arrivedAtDropoff;
          final arriveResult = await _recoverArriveResult(activeAssignment.assignment.orderId, attempt!);
          if (_isDisposed) {
            return;
          }

          waitUntil = arriveResult?.waitUntil ?? attempt.arrivedAt.add(const Duration(minutes: 5));
          waitElapsed = DateTime.now().isAfter(waitUntil);
        }
      }

      _setState(state.copyWith(activeOrderId: orderId, status: status, waitUntil: waitUntil, waitElapsed: waitElapsed));

      if (status == OrderStatus.arrivedAtDropoff && waitUntil != null) {
        _startWaitTimer();
      }
    } catch (_) {
      // No-op: recovery failures should not block app startup.
    }
  }

  Future<ArriveResult?> _recoverArriveResult(int orderId, DeliveryAttempt attempt) async {
    try {
      final gps = attempt.gps;
      if (gps != null) {
        return await ref.read(apiServiceProvider).arriveAtDelivery(orderId, lat: gps.latitude, lng: gps.longitude);
      }

      final position = await ref.read(locationServiceProvider.notifier).getCurrentLocation();
      return await ref.read(apiServiceProvider).arriveAtDelivery(orderId, lat: position.latitude, lng: position.longitude);
    } catch (_) {
      return null;
    }
  }

  OrderStatus _statusFromAssignment(String? orderStatus) {
    switch (orderStatus) {
      case AssignmentOrderStatus.accepted:
        return OrderStatus.accepted;
      case AssignmentOrderStatus.pickedUp:
        return OrderStatus.pickedUp;
      case AssignmentOrderStatus.inTransit:
        return OrderStatus.navigatingToDropoff;
      case AssignmentOrderStatus.delivered:
        return OrderStatus.delivered;
      case AssignmentOrderStatus.undeliverable:
        return OrderStatus.undeliverable;
      case AssignmentOrderStatus.returning:
        return OrderStatus.returning;
      case AssignmentOrderStatus.returned:
        return OrderStatus.returned;
      default:
        return OrderStatus.idle;
    }
  }
}

enum OrderStatus {
  idle,
  accepted,
  navigatingToPickup,
  arrivedAtPickup,
  pickedUp,
  navigatingToDropoff,
  arrivedAtDropoff,
  delivered,
  undeliverable,
  returning,
  returned,
}

class OrderState {
  const OrderState({this.activeOrderId, this.status = OrderStatus.idle, this.waitUntil, this.waitElapsed = false});

  final String? activeOrderId;
  final OrderStatus status;
  final DateTime? waitUntil;
  final bool waitElapsed;

  static const Object _sentinel = Object();

  OrderState copyWith({Object? activeOrderId = _sentinel, OrderStatus? status, Object? waitUntil = _sentinel, bool? waitElapsed}) => OrderState(
    activeOrderId: activeOrderId == _sentinel ? this.activeOrderId : activeOrderId as String?,
    status: status ?? this.status,
    waitUntil: waitUntil == _sentinel ? this.waitUntil : waitUntil as DateTime?,
    waitElapsed: waitElapsed ?? this.waitElapsed,
  );
}
