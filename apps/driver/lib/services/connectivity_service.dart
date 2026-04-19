import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../utils/logger.dart';

part 'connectivity_service.g.dart';

/// True when device has any active network connection.
final isOnlineProvider = StateProvider<bool>((ref) => true);

/// Incremented each time connectivity is restored (offline → online).
/// Watchers use this as a signal to flush queued work.
@riverpod
int connectivityRestoredSignal(Ref ref) => 0;

@Riverpod(keepAlive: true)
ConnectivityService connectivityService(Ref ref) => ConnectivityService(ref);

class ConnectivityService {
  ConnectivityService(this._ref) {
    _init();
  }

  final Ref _ref;
  final _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _sub;

  void _init() {
    _connectivity.checkConnectivity().then((results) {
      _ref.read(isOnlineProvider.notifier).state = _hasConnection(results);
    });

    _sub = _connectivity.onConnectivityChanged.listen((results) {
      final wasOnline = _ref.read(isOnlineProvider);
      final nowOnline = _hasConnection(results);
      if (wasOnline == nowOnline) {
        return;
      }

      _ref.read(isOnlineProvider.notifier).state = nowOnline;
      if (!wasOnline && nowOnline) {
        AppLogger.d('Connectivity: restored');
        _ref.invalidate(connectivityRestoredSignalProvider);
      } else {
        AppLogger.d('Connectivity: lost');
      }
    });

    _ref.onDispose(() => _sub?.cancel());
  }

  static bool _hasConnection(List<ConnectivityResult> results) =>
      results.any((r) => r != ConnectivityResult.none);
}
