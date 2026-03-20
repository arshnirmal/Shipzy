import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'theme/driver_app_theme.dart';
import 'utils/app_router.dart';

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
      routerConfig: router,
      builder: (context, child) => MediaQuery(
        data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
        child: child!,
      ),
    );
  }
}
