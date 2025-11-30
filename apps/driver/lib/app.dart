import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shipzy_driver/theme/driver_app_theme.dart';
import 'package:shipzy_driver/utils/app_router.dart';

class ShipzyDriverApp extends ConsumerWidget {
  const ShipzyDriverApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Shipzy Driver',
      debugShowCheckedModeBanner: false,
      theme: DriverAppTheme.lightTheme,
      darkTheme: DriverAppTheme.darkTheme,
      themeMode: ThemeMode.system,
      routerConfig: router,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
        child: child!,
      ),
    );
  }
}
