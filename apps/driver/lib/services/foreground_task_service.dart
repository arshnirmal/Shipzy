// lib/services/foreground_task_service.dart
// Wraps flutter_foreground_task for location broadcasting during active deliveries.
// Started when order status enters picked_up, stopped on delivered/returned/idle.

import 'package:flutter_foreground_task/flutter_foreground_task.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../utils/logger.dart';

part 'foreground_task_service.g.dart';

@riverpod
ForegroundTaskService foregroundTaskService(Ref ref) => ForegroundTaskService();

class ForegroundTaskService {
  static const _notificationChannelId = 'shipzy_delivery';
  static const _notificationChannelName = 'Shipzy Delivery';

  void _configure() {
    FlutterForegroundTask.init(
      androidNotificationOptions: AndroidNotificationOptions(
        channelId: _notificationChannelId,
        channelName: _notificationChannelName,
        channelDescription: 'Active delivery in progress',
      ),
      iosNotificationOptions: const IOSNotificationOptions(),
      foregroundTaskOptions: ForegroundTaskOptions(
        eventAction: ForegroundTaskEventAction.repeat(30000), // 30s tick
      ),
    );
  }

  Future<void> start() async {
    _configure();
    if (await FlutterForegroundTask.isRunningService) {
      AppLogger.d('Foreground task already running — skip start');
      return;
    }
    final result = await FlutterForegroundTask.startService(
      serviceId: 256,
      notificationTitle: 'Shipzy Delivery Active',
      notificationText: 'Location broadcasting is on',
    );
    AppLogger.d('Foreground task started: $result');
  }

  Future<void> stop() async {
    if (!await FlutterForegroundTask.isRunningService) {
      return;
    }
    final result = await FlutterForegroundTask.stopService();
    AppLogger.d('Foreground task stopped: $result');
  }

  Future<void> updateNotification(String text) async {
    if (!await FlutterForegroundTask.isRunningService) {
      return;
    }
    await FlutterForegroundTask.updateService(notificationText: text);
  }
}
