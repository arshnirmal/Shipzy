import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';

import '../utils/app_routes.dart';

class PermissionsScreen extends StatefulWidget {
  const PermissionsScreen({super.key});

  @override
  State<PermissionsScreen> createState() => _PermissionsScreenState();
}

class _PermissionsScreenState extends State<PermissionsScreen> {
  bool _isRequesting = false;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              Icon(
                Icons.shield_outlined,
                size: 56,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(height: 24),
              Text(
                'Enable permissions',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                'Shipzy Driver needs these to receive orders, track deliveries, and capture proof of delivery.',
                style: theme.textTheme.bodyLarge,
              ),
              const SizedBox(height: 32),
              const _PermissionRow(
                icon: Icons.my_location_rounded,
                title: 'Location (always on)',
                description: 'Required to appear online and track deliveries.',
              ),
              const SizedBox(height: 20),
              const _PermissionRow(
                icon: Icons.notifications_outlined,
                title: 'Notifications',
                description: 'Required to receive new order alerts.',
              ),
              const SizedBox(height: 20),
              const _PermissionRow(
                icon: Icons.camera_alt_outlined,
                title: 'Camera',
                description: 'Required for proof-of-delivery photos.',
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                height: 52,
                child: FilledButton(
                  onPressed: _isRequesting ? null : _requestAll,
                  child: _isRequesting
                      ? const SizedBox.square(
                          dimension: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Grant permissions'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _requestAll() async {
    setState(() => _isRequesting = true);

    // Fine location first — background requires it to be granted first.
    final locationStatus = await Permission.location.request();
    if (locationStatus.isGranted) {
      await Permission.locationAlways.request();
    }

    // Notifications (no-op below Android 13).
    await Permission.notification.request();

    // Camera for PoD.
    await Permission.camera.request();

    // Battery optimization exemption — non-blocking, warn only.
    await Permission.ignoreBatteryOptimizations.request();

    setState(() => _isRequesting = false);

    if (!mounted) {
      return;
    }
    final granted = await _requiredGranted();
    if (!mounted) {
      return;
    }

    if (granted) {
      context.go(AppRoutes.home);
    } else {
      _showSettingsDialog();
    }
  }

  Future<bool> _requiredGranted() async {
    final location = await Permission.location.status;
    final notification = await Permission.notification.status;
    final camera = await Permission.camera.status;
    return location.isGranted &&
        (notification.isGranted || notification.isLimited) &&
        camera.isGranted;
  }

  void _showSettingsDialog() {
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Permissions required'),
        content: const Text(
          'Some permissions were denied. Please enable them in device Settings to use Shipzy Driver.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(ctx);
              openAppSettings();
            },
            child: const Text('Open settings'),
          ),
        ],
      ),
    );
  }
}

class _PermissionRow extends StatelessWidget {
  const _PermissionRow({
    required this.icon,
    required this.title,
    required this.description,
  });

  final IconData icon;
  final String title;
  final String description;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 22, color: theme.colorScheme.primary),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(description, style: theme.textTheme.bodySmall),
            ],
          ),
        ),
      ],
    );
  }
}
