import 'package:flutter/material.dart';

import '../../../theme/app_theme_extension.dart';

class SwipeToAccept extends StatefulWidget {
  const SwipeToAccept({
    required this.onAccept,
    super.key,
    this.text = 'SWIPE TO ACCEPT',
  });

  final VoidCallback onAccept;
  final String text;

  @override
  State<SwipeToAccept> createState() => _SwipeToAcceptState();
}

class _SwipeToAcceptState extends State<SwipeToAccept> {
  double _dragPosition = 0;
  bool _accepted = false;
  final double _trackHeight = 64;
  final double _thumbSize = 52;
  double _maxWidth = 0;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeExt = theme.extension<AppThemeExtension>();

    return LayoutBuilder(
      builder: (context, constraints) {
        _maxWidth = constraints.maxWidth;
        final maxDragPosition = _maxWidth - _thumbSize - 6; // 6 is padding

        return Container(
          height: _trackHeight,
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceContainerHigh,
            borderRadius: BorderRadius.circular(_trackHeight / 2),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              // Background track color when sliding
              if (_dragPosition > 0)
                Container(
                  height: _trackHeight,
                  width: _dragPosition + _thumbSize + 6,
                  decoration: BoxDecoration(
                    gradient: themeExt?.primaryGradient,
                    borderRadius: BorderRadius.circular(_trackHeight / 2),
                  ),
                ),
              // Text
              Center(
                child: Opacity(
                  opacity: (1 - (_dragPosition / maxDragPosition)).clamp(0, 1),
                  child: Text(
                    widget.text,
                    style: theme.textTheme.labelLarge?.copyWith(
                      letterSpacing: 2,
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ),
              ),
              // Draggable Thumb
              Positioned(
                left: _dragPosition + 3,
                top: (_trackHeight - _thumbSize) / 2,
                child: GestureDetector(
                  onHorizontalDragUpdate: (details) {
                    if (_accepted) {
                      return;
                    }
                    setState(() {
                      _dragPosition += details.delta.dx;
                      if (_dragPosition < 0) {
                        _dragPosition = 0;
                      }
                      if (_dragPosition > maxDragPosition) {
                        _dragPosition = maxDragPosition;
                      }
                    });
                  },
                  onHorizontalDragEnd: (details) {
                    if (_accepted) {
                      return;
                    }
                    if (_dragPosition > maxDragPosition * 0.8) {
                      setState(() {
                        _dragPosition = maxDragPosition;
                        _accepted = true;
                      });
                      widget.onAccept();
                    } else {
                      setState(() {
                        _dragPosition = 0;
                      });
                    }
                  },
                  child: Container(
                    width: _thumbSize,
                    height: _thumbSize,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: _dragPosition > 0
                          ? null
                          : themeExt?.primaryGradient,
                      color: _dragPosition > 0 ? Colors.white : null,
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Icon(
                      Icons.arrow_forward_rounded,
                      color: _dragPosition > 0
                          ? theme.colorScheme.primary
                          : Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
