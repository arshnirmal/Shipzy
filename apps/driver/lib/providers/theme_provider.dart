import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage_provider.dart';

const String _kDevThemeModeKey = 'dev_theme_mode';

final StateNotifierProvider<ThemeModeController, ThemeMode> themeModeProvider = StateNotifierProvider<ThemeModeController, ThemeMode>((Ref ref) {
  final controller = ThemeModeController(ref);
  ref.onDispose(controller.dispose);
  return controller;
});

class ThemeModeController extends StateNotifier<ThemeMode> {
  ThemeModeController(this._ref) : super(ThemeMode.system) {
    _loadPersistedThemeMode();
  }

  final Ref _ref;

  Future<void> cycleThemeMode() async {
    final ThemeMode nextThemeMode;
    switch (state) {
      case ThemeMode.light:
        nextThemeMode = ThemeMode.dark;
      case ThemeMode.dark:
        nextThemeMode = ThemeMode.system;
      case ThemeMode.system:
        nextThemeMode = ThemeMode.light;
    }
    await setThemeMode(nextThemeMode);
  }

  Future<void> setThemeMode(ThemeMode themeMode) async {
    state = themeMode;
    final storageValue = _toStorageValue(themeMode);
    final sharedPreferences = await _ref.read(sharedPreferencesProvider.future);
    await sharedPreferences.setString(_kDevThemeModeKey, storageValue);
  }

  Future<void> _loadPersistedThemeMode() async {
    final sharedPreferences = await _ref.read(sharedPreferencesProvider.future);
    final persistedValue = sharedPreferences.getString(_kDevThemeModeKey);
    state = _fromStorageValue(persistedValue);
  }

  ThemeMode _fromStorageValue(String? persistedValue) {
    switch (persistedValue) {
      case 'light':
        return ThemeMode.light;
      case 'dark':
        return ThemeMode.dark;
      default:
        return ThemeMode.system;
    }
  }

  String _toStorageValue(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return 'light';
      case ThemeMode.dark:
        return 'dark';
      case ThemeMode.system:
        return 'system';
    }
  }
}
