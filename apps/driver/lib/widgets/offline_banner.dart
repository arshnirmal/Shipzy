import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/connectivity_service.dart';

/// Persistent top banner shown whenever the device has no network connection.
/// Mount once in the app-level builder so it overlays every screen.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isOnline = ref.watch(isOnlineProvider);
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 250),
      child: isOnline
          ? const SizedBox.shrink()
          : Material(
              key: const ValueKey('offline'),
              color: Colors.transparent,
              child: Container(
                width: double.infinity,
                color: const Color(0xFF323232),
                padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                child: SafeArea(
                  bottom: false,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.wifi_off_rounded, color: Colors.white, size: 14),
                      const SizedBox(width: 8),
                      Text(
                        'No internet connection',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.white),
                      ),
                    ],
                  ),
                ),
              ),
            ),
    );
  }
}
