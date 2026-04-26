import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import 'services/connectivity_service.dart';
import 'services/notification_service.dart';
import 'theme/app_theme.dart';
import 'utils/app_router.dart';
import 'utils/logger.dart';
import 'widgets/dev_theme_switcher.dart';
import 'widgets/offline_banner.dart';

class ShipzyDriverApp extends ConsumerStatefulWidget {
  const ShipzyDriverApp({super.key});

  @override
  ConsumerState<ShipzyDriverApp> createState() => _ShipzyDriverAppState();
}

class _ShipzyDriverAppState extends ConsumerState<ShipzyDriverApp> {
  bool _fcmInitialized = false;

  @override
  void initState() {
    super.initState();
    // Eagerly start connectivity monitoring.
    ref.read(connectivityServiceProvider);
    // Listen for first authenticated state to set up FCM.
    // Re-triggers if user logs out and back in.
    ref.listenManual(authProvider, (previous, next) {
      final isNowAuthenticated = next.valueOrNull is Authenticated;
      final wasAuthenticated = previous?.valueOrNull is Authenticated;

      if (isNowAuthenticated && !wasAuthenticated) {
        _fcmInitialized = false;
      }

      if (isNowAuthenticated && !_fcmInitialized) {
        _fcmInitialized = true;
        ref.read(notificationServiceProvider).initialize().catchError((e) {
          AppLogger.w('FCM initialization failed: $e');
        });
      }
    }, fireImmediately: true);
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Shipzy Driver',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) {
        final Widget mediaQueryWrappedChild = MediaQuery(
          data: MediaQuery.of(
            context,
          ).copyWith(textScaler: TextScaler.noScaling),
          child: child ?? const SizedBox.shrink(),
        );

        Widget result = Column(
          children: [
            const OfflineBanner(),
            Expanded(child: mediaQueryWrappedChild),
          ],
        );

        if (kDebugMode) {
          result = Stack(
            fit: StackFit.expand,
            children: [result, const DevThemeSwitcher()],
          );
        }

        return result;
      },
    );
  }
}
