import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/theme_provider.dart';

/// Dev-only draggable floating button that cycles through light -> dark -> system.
class DevThemeSwitcher extends ConsumerStatefulWidget {
  const DevThemeSwitcher({super.key});

  @override
  ConsumerState<DevThemeSwitcher> createState() => _DevThemeSwitcherState();
}

class _DevThemeSwitcherState extends ConsumerState<DevThemeSwitcher> {
  Offset _position = const Offset(12, 48);

  ThemeMode _nextMode(ThemeMode current) => switch (current) {
    ThemeMode.system => ThemeMode.light,
    ThemeMode.light => ThemeMode.dark,
    ThemeMode.dark => ThemeMode.system,
  };

  IconData _iconForMode(ThemeMode themeMode) => switch (themeMode) {
    ThemeMode.light => Icons.light_mode,
    ThemeMode.dark => Icons.dark_mode,
    ThemeMode.system => Icons.brightness_auto,
  };

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final size = MediaQuery.sizeOf(context);
    const buttonSize = 40.0;
    final colorScheme = Theme.of(context).colorScheme;

    return Positioned(
      left: _position.dx,
      top: _position.dy,
      child: GestureDetector(
        onPanUpdate: (details) {
          setState(() {
            _position = Offset(
              (_position.dx + details.delta.dx).clamp(0, size.width - buttonSize),
              (_position.dy + details.delta.dy).clamp(0, size.height - buttonSize),
            );
          });
        },
        child: FloatingActionButton.small(
          heroTag: 'dev_theme_switcher',
          backgroundColor: colorScheme.primaryContainer.withValues(alpha: 0.85),
          onPressed: () => ref.read(themeModeProvider.notifier).setThemeMode(_nextMode(themeMode)),
          child: Icon(_iconForMode(themeMode), size: 18),
        ),
      ),
    );
  }
}
