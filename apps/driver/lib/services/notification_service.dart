// lib/services/notification_service.dart
// FCM setup: permission request, token registration, foreground/background message routing.

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../utils/logger.dart';
import 'api_service.dart';

part 'notification_service.g.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Background handler runs in a separate Dart isolate.
  // Keep lightweight — no provider access, no UI.
  AppLogger.d(
    'FCM background message: ${message.messageId} type=${message.data['type']}',
  );
}

@riverpod
NotificationService notificationService(Ref ref) => NotificationService(ref);

class NotificationService {
  NotificationService(this._ref);

  final Ref _ref;
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;

  /// Call once after the user is authenticated. Idempotent.
  Future<void> initialize() async {
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    await _requestPermission();
    await _registerToken();
    _listenForeground();
    _listenTokenRefresh();
  }

  Future<void> _requestPermission() async {
    final settings = await _fcm.requestPermission();
    AppLogger.d('FCM permission: ${settings.authorizationStatus}');
  }

  Future<void> _registerToken() async {
    try {
      final token = await _fcm.getToken();
      if (token == null) {
        AppLogger.w('FCM token is null — skipping registration');
        return;
      }
      await _ref
          .read(apiServiceProvider)
          .registerDeviceToken(deviceToken: token);
      AppLogger.d('FCM token registered');
    } catch (e) {
      // Non-fatal — app works without push, token registration retried on next launch.
      AppLogger.w('FCM token registration failed: $e');
    }
  }

  void _listenForeground() {
    FirebaseMessaging.onMessage.listen(_routeMessage);
    // Tapped while app in background (resumed from notification)
    FirebaseMessaging.onMessageOpenedApp.listen(_routeMessage);
  }

  void _listenTokenRefresh() {
    _fcm.onTokenRefresh.listen((newToken) async {
      try {
        await _ref
            .read(apiServiceProvider)
            .registerDeviceToken(deviceToken: newToken);
        AppLogger.d('FCM token refreshed and re-registered');
      } catch (e) {
        AppLogger.w('FCM token refresh registration failed: $e');
      }
    });
  }

  void _routeMessage(RemoteMessage message) {
    final type = message.data['type'] as String?;
    AppLogger.d('FCM message routed: type=$type');

    switch (type) {
      case 'order.available':
        // Signal home provider to refresh available orders.
        // Uses invalidate so the next read re-fetches from backend.
        // Import is avoided here to prevent circular deps — use a notifier instead.
        _ref.invalidate(availableOrdersRefreshSignalProvider);
      case 'order.cancelled':
        final orderId = message.data['orderId'] as String?;
        AppLogger.d('Order cancelled via FCM: orderId=$orderId');
        // OrderProvider self-checks on next tick; broadcast enough to trigger UI.
        _ref.invalidate(orderCancelledSignalProvider);
      default:
        AppLogger.d('Unhandled FCM type: $type');
    }
  }
}

/// Lightweight signal providers. Screens/providers watch these to react to FCM events.
/// Invalidating them notifies all listeners without carrying data (avoids coupling).

@riverpod
int availableOrdersRefreshSignal(Ref ref) => 0;

@riverpod
int orderCancelledSignal(Ref ref) => 0;
