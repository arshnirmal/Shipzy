import 'package:flutter/material.dart';

/// Utility class for showing consistent SnackBar messages across the app
class SnackbarUtils {
  /// Determines the appropriate SnackBar behavior based on keyboard visibility
  static SnackBarBehavior _getBehavior(BuildContext context) {
    // Use fixed behavior when keyboard is visible to prevent off-screen issues
    final viewInsets = MediaQuery.of(context).viewInsets;
    final hasKeyboard = viewInsets.bottom > 0;
    return hasKeyboard ? SnackBarBehavior.fixed : SnackBarBehavior.floating;
  }

  /// Shows a success message with primary color background
  static void showSuccess(BuildContext context, String message) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: Theme.of(context).colorScheme.primary, behavior: _getBehavior(context)));
  }

  /// Shows an error message with error color background
  static void showError(BuildContext context, String message, {bool showDismiss = false}) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Theme.of(context).colorScheme.error,
        behavior: _getBehavior(context),
        action: showDismiss ? SnackBarAction(label: 'Dismiss', textColor: Colors.white, onPressed: () {}) : null,
      ),
    );
  }

  /// Shows an informational message with surface color background
  static void showInfo(BuildContext context, String message) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message), backgroundColor: Theme.of(context).colorScheme.surface, behavior: _getBehavior(context)));
  }

  /// Shows a custom SnackBar with full configuration
  static void showCustom({
    required BuildContext context,
    required String message,
    required Color backgroundColor,
    SnackBarBehavior? behavior,
    SnackBarAction? action,
    Duration duration = const Duration(seconds: 4),
  }) {
    if (!context.mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: backgroundColor,
        behavior: behavior ?? _getBehavior(context),
        action: action,
        duration: duration,
      ),
    );
  }
}
