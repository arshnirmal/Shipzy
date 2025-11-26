import 'package:flutter/material.dart';

class EmptyState extends StatelessWidget {
  const EmptyState({required this.title, required this.message, required this.icon, super.key, this.buttonText, this.onButtonPressed, this.action});
  final String title;
  final String message;
  final IconData icon;
  final String? buttonText;
  final VoidCallback? onButtonPressed;
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.5), shape: BoxShape.circle),
              child: Icon(icon, size: 48, color: theme.colorScheme.primary.withValues(alpha: 0.5)),
            ),
            const SizedBox(height: 24),
            Text(
              title,
              style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(message, style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
            const SizedBox(height: 32),
            if (action != null)
              action!
            else if (buttonText != null && onButtonPressed != null)
              ElevatedButton(onPressed: onButtonPressed, child: Text(buttonText!)),
          ],
        ),
      ),
    );
  }
}
