import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/theme_provider.dart';

class DevThemeSwitcher extends ConsumerStatefulWidget {
  const DevThemeSwitcher({super.key});

  @override
  ConsumerState<DevThemeSwitcher> createState() => _DevThemeSwitcherState();
}

class _DevThemeSwitcherState extends ConsumerState<DevThemeSwitcher> {
  static const double _kSwitcherSize = 48;
  static const double _kMargin = 16;

  Offset? _position;
  bool _isDragging = false;

  @override
  Widget build(BuildContext context) {
    final themeMode = ref.watch(themeModeProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return IgnorePointer(
      ignoring: false,
      child: LayoutBuilder(
        builder: (context, constraints) {
          const minX = _kMargin;
          const minY = _kMargin;
          final maxX = (constraints.maxWidth - _kSwitcherSize - _kMargin).clamp(_kMargin, double.infinity).toDouble();
          final maxY = (constraints.maxHeight - _kSwitcherSize - _kMargin).clamp(_kMargin, double.infinity).toDouble();

          final effectivePosition = _position ?? Offset(maxX, maxY);

          return AnimatedPositioned(
            duration: _isDragging ? Duration.zero : const Duration(milliseconds: 220),
            curve: Curves.easeOutCubic,
            left: effectivePosition.dx.clamp(minX, maxX),
            top: effectivePosition.dy.clamp(minY, maxY),
            child: GestureDetector(
              onTap: () => ref.read(themeModeProvider.notifier).cycleThemeMode(),
              onPanStart: (_) {
                setState(() {
                  _isDragging = true;
                  _position = effectivePosition;
                });
              },
              onPanUpdate: (details) {
                setState(() {
                  final currentPosition = _position ?? effectivePosition;
                  _position = Offset(
                    (currentPosition.dx + details.delta.dx).clamp(minX, maxX),
                    (currentPosition.dy + details.delta.dy).clamp(minY, maxY),
                  );
                });
              },
              onPanEnd: (_) {
                final currentPosition = _position ?? effectivePosition;
                final snapLeft = currentPosition.dx + (_kSwitcherSize / 2) < constraints.maxWidth / 2;

                setState(() {
                  _isDragging = false;
                  _position = Offset(snapLeft ? minX : maxX, currentPosition.dy.clamp(minY, maxY));
                });
              },
              child: Material(
                elevation: 8,
                color: colorScheme.surface,
                shape: const CircleBorder(),
                shadowColor: colorScheme.shadow.withValues(alpha: 0.22),
                child: SizedBox(
                  width: _kSwitcherSize,
                  height: _kSwitcherSize,
                  child: Center(
                    child: AnimatedSwitcher(
                      duration: const Duration(milliseconds: 180),
                      transitionBuilder: (child, animation) => FadeTransition(
                        opacity: animation,
                        child: ScaleTransition(scale: animation, child: child),
                      ),
                      child: Icon(_iconForMode(themeMode), key: ValueKey<ThemeMode>(themeMode), color: colorScheme.primary),
                    ),
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  IconData _iconForMode(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return Icons.light_mode_rounded;
      case ThemeMode.dark:
        return Icons.dark_mode_rounded;
      case ThemeMode.system:
        return Icons.brightness_auto_rounded;
    }
  }
}
