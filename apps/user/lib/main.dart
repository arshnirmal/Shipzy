import 'dart:async';
import 'dart:ui';

import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app.dart';
import 'providers/storage_provider.dart';
import 'utils/logger.dart';

Future<void> main() async {
  // Run everything in a single zone to avoid zone mismatch issues
  await runZonedGuarded(
    () async {
      // Ensure Flutter bindings
      WidgetsFlutterBinding.ensureInitialized();

      // Load environment variables
      await dotenv.load();

      // Set Mapbox access token
      MapboxOptions.setAccessToken(dotenv.env['MAPBOX_ACCESS_TOKEN'] ?? '');

      // Initialize Firebase
      await Firebase.initializeApp();

      // Set preferred orientations
      await SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp, DeviceOrientation.portraitDown]);

      // Set system UI overlay
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          systemNavigationBarColor: Colors.white,
          systemNavigationBarIconBrightness: Brightness.dark,
        ),
      );

      // Initialize logger
      AppLogger.init();

      // Set up global error handling
      _setupErrorHandling();

      // Run app with ProviderScope
      // Pre-initialize SharedPreferences for immediate synchronous access in AppRouter
      final sharedPrefs = await SharedPreferences.getInstance();

      runApp(
        ProviderScope(
          overrides: [
            sharedPreferencesProvider.overrideWithValue(AsyncValue.data(sharedPrefs)),
          ],
          child: const ShipzyApp(),
        ),
      );
    },
    (error, stackTrace) {
      AppLogger.e('Uncaught Async Error: $error', error: error, stackTrace: stackTrace);
    },
  );
}

/// Sets up global error handling to catch and log all uncaught errors and exceptions.
/// This ensures that errors are visible in the debug console during development.
void _setupErrorHandling() {
  // Catch Flutter framework errors
  FlutterError.onError = (FlutterErrorDetails details) {
    AppLogger.e('Flutter Error: ${details.exception}', error: details.exception, stackTrace: details.stack);
    // Also print to console for immediate visibility
    FlutterError.dumpErrorToConsole(details);
  };

  // Catch platform errors (Dart errors that occur outside of Flutter)
  PlatformDispatcher.instance.onError = (error, stack) {
    AppLogger.e('Platform Error: $error', error: error, stackTrace: stack);
    // Return false to allow the error to also be printed to console
    return false;
  };
}
