// lib/screens/home/widgets/custom_home_app_bar.dart

import 'package:flutter/material.dart';

class CustomHomeAppBar extends StatelessWidget {
  const CustomHomeAppBar({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      height: 72,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface.withValues(alpha: 0.9),
        border: Border(bottom: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.5), width: 0.5)),
      ),
      child: Row(
        children: [
          // Menu icon
          SizedBox(
            width: 48,
            height: 48,
            child: IconButton(
              onPressed: () => Scaffold.of(context).openDrawer(),
              icon: Icon(Icons.menu, size: 20, color: theme.colorScheme.onSurface),
            ),
          ),

          // Title
          Expanded(
            child: Center(
              child: Text(
                'Shipzy',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onSurface,
                  letterSpacing: -0.27,
                ),
              ),
            ),
          ),

          // Notification icon
          SizedBox(
            width: 48,
            height: 48,
            child: IconButton(
              onPressed: () {
                // TODO: Handle notifications
              },
              icon: Icon(Icons.notifications_outlined, size: 20, color: theme.colorScheme.onSurface),
            ),
          ),
        ],
      ),
    );
  }
}
