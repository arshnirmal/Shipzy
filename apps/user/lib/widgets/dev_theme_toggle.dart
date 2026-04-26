import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/theme_provider.dart';

/// Dev-only draggable floating button that cycles through light → dark → system theme modes.
/// Rendered only when kDebugMode is true (guarded in app.dart).
class DevThemeToggle extends ConsumerStatefulWidget {
  const DevThemeToggle({super.key});

  @override
  ConsumerState<DevThemeToggle> createState() => _DevThemeToggleState();
}

class _DevThemeToggleState extends ConsumerState<DevThemeToggle> {
  Offset _position = const Offset(12, 48);

  ThemeMode _nextMode(ThemeMode current) => switch (current) {
        ThemeMode.system => ThemeMode.light,
        ThemeMode.light => ThemeMode.dark,
        ThemeMode.dark => ThemeMode.system,
      };

  IconData _icon(ThemeMode mode) => switch (mode) {
        ThemeMode.light => Icons.light_mode,
        ThemeMode.dark => Icons.dark_mode,
        ThemeMode.system => Icons.brightness_auto,
      };

  @override
  Widget build(BuildContext context) {
    final mode = ref.watch(themeModeProvider);
    final size = MediaQuery.sizeOf(context);
    const buttonSize = 40.0;

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
          heroTag: 'dev_theme_toggle',
          backgroundColor:
              Theme.of(context).colorScheme.primaryContainer.withValues(alpha: 0.85),
          onPressed: () =>
              ref.read(themeModeProvider.notifier).setThemeMode(_nextMode(mode)),
          child: Icon(_icon(mode), size: 18),
        ),
      ),
    );
  }
}
