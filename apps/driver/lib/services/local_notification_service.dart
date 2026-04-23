// lib/services/local_notification_service.dart
// Local push notifications for wait-timer elapsed, idle duty prompt, and battery warnings.
// Uses flutter_local_notifications; initialized lazily on first show call.

import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../utils/logger.dart';

final localNotificationServiceProvider = Provider<LocalNotificationService>(
  (ref) => LocalNotificationService(),
);

class LocalNotificationService {
  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  static const _channelId = 'shipzy_driver_local';
  static const _channelName = 'Shipzy Driver Alerts';

  static const _idWaitElapsed = 10;
  static const _idIdlePrompt = 11;
  static const _idLowBattery = 12;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }
    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    await _plugin.initialize(
      const InitializationSettings(android: androidSettings),
    );
    await _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(
          const AndroidNotificationChannel(
            _channelId,
            _channelName,
            description: 'Timer and duty alerts for drivers',
            importance: Importance.high,
          ),
        );
    _initialized = true;
  }

  Future<void> showWaitTimerElapsed() => _show(
    id: _idWaitElapsed,
    title: 'Wait time elapsed',
    body:
        'You can mark the delivery as undeliverable if the customer is unavailable.',
  );

  Future<void> showIdleDutyPrompt() => _show(
    id: _idIdlePrompt,
    title: 'Still on duty?',
    body: "You've been online with no activity for 30 minutes.",
  );

  Future<void> showLowBatteryWarning(int level) => _show(
    id: _idLowBattery,
    title: 'Low battery: $level%',
    body: 'Charge your device soon to keep receiving deliveries.',
  );

  Future<void> cancel(int id) async => _plugin.cancel(id);

  Future<void> _show({
    required int id,
    required String title,
    required String body,
  }) async {
    if (!_initialized) {
      await initialize();
    }
    const details = NotificationDetails(
      android: AndroidNotificationDetails(
        _channelId,
        _channelName,
        importance: Importance.high,
        priority: Priority.high,
      ),
    );
    try {
      await _plugin.show(id, title, body, details);
    } catch (e) {
      AppLogger.w('Local notification show failed: $e');
    }
  }
}
