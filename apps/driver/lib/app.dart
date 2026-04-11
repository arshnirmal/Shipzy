import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'providers/theme_provider.dart';
import 'theme/driver_app_theme.dart';
import 'utils/app_router.dart';
import 'widgets/dev_theme_switcher.dart';

class ShipzyDriverApp extends ConsumerWidget {
  const ShipzyDriverApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'Shipzy Driver',
      debugShowCheckedModeBanner: false,
      theme: DriverAppTheme.lightTheme,
      darkTheme: DriverAppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      builder: (context, child) {
        final Widget mediaQueryWrappedChild = MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
          child: child ?? const SizedBox.shrink(),
        );

        if (!kDebugMode) {
          return mediaQueryWrappedChild;
        }

        return Stack(fit: StackFit.expand, children: [mediaQueryWrappedChild, const DevThemeSwitcher()]);
      },
    );
  }
}
