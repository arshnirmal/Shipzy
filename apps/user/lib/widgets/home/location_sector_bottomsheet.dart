// lib/widgets/navigation/location_selector_sheet.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/saved_address.dart';
import '../../providers/address_provider.dart';
import '../../providers/location_provider.dart';

class LocationSelectorSheet extends ConsumerWidget {
  const LocationSelectorSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final currentLocation = ref.watch(currentLocationProvider);
    final savedAddresses = ref.watch(savedAddressesProvider);
    final selectedLocation = ref.watch(locationNotifierProvider);

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4), borderRadius: BorderRadius.circular(2)),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Icon(Icons.location_on_rounded, color: theme.colorScheme.primary, size: 24),
                  const SizedBox(width: 12),
                  Text('Select Location', style: theme.textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
                  const Spacer(),
                  IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close), iconSize: 24),
                ],
              ),
            ),

            const Divider(),

            // Current Location Option
            currentLocation.when(
              data: (position) {
                if (position != null) {
                  return _LocationTile(
                    icon: Icons.my_location_rounded,
                    label: 'Current Location',
                    address: 'Using GPS',
                    isSelected: selectedLocation.value?.isCurrentLocation ?? false,
                    onTap: () async {
                      final address = await ref.read(addressFromCoordinatesProvider(position).future);

                      ref
                          .read(locationNotifierProvider.notifier)
                          .selectAddress(
                            SavedAddress(
                              label: 'Current Location',
                              fullAddress: address ?? 'Current Location',
                              latitude: position.latitude,
                              longitude: position.longitude,
                              isCurrentLocation: true,
                            ),
                          );
                      if (context.mounted) {
                        Navigator.pop(context);
                      }
                    },
                  );
                }
                return const SizedBox.shrink();
              },
              loading: () => const _LocationTileLoading(),
              error: (_, _) => _LocationTile(
                icon: Icons.location_off_outlined,
                label: 'Enable Location',
                address: 'Grant location permission to use current location',
                isSelected: false,
                onTap: () async {
                  await ref.read(locationNotifierProvider.notifier).requestLocationPermission();
                },
              ),
            ),

            const Divider(),

            // Saved Addresses
            Flexible(
              child: savedAddresses.when(
                data: (addresses) {
                  if (addresses.isEmpty) {
                    return Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.bookmark_border_rounded, size: 48, color: theme.colorScheme.onSurfaceVariant),
                          const SizedBox(height: 16),
                          Text('No saved addresses', style: theme.textTheme.titleMedium),
                          const SizedBox(height: 8),
                          Text(
                            'Add addresses for quick access',
                            style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: addresses.length,
                    separatorBuilder: (_, _) => const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final address = addresses[index];
                      final isSelected = selectedLocation.value?.addressId == address.addressId;

                      return _LocationTile(
                        icon: _getIconForLabel(address.label),
                        label: address.label,
                        address: address.fullAddress,
                        isSelected: isSelected,
                        onTap: () {
                          ref.read(locationNotifierProvider.notifier).selectAddress(address);
                          Navigator.pop(context);
                        },
                      );
                    },
                  );
                },
                loading: () => const Center(
                  child: Padding(padding: EdgeInsets.all(32), child: CircularProgressIndicator()),
                ),
                error: (error, _) => Padding(
                  padding: const EdgeInsets.all(32),
                  child: Text(
                    'Failed to load addresses: $error',
                    style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.error),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
            ),

            // Add New Address Button
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () {
                    Navigator.pop(context);
                    // TODO: Navigate to add address screen
                  },
                  icon: const Icon(Icons.add_location_outlined),
                  label: const Text('Add New Address'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  IconData _getIconForLabel(String label) {
    switch (label.toLowerCase()) {
      case 'home':
        return Icons.home_outlined;
      case 'work':
        return Icons.work_outline_rounded;
      default:
        return Icons.location_on_outlined;
    }
  }
}

class _LocationTile extends StatelessWidget {
  const _LocationTile({required this.icon, required this.label, required this.address, required this.isSelected, required this.onTap});

  final IconData icon;
  final String label;
  final String address;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: isSelected ? theme.colorScheme.primary.withValues(alpha: 0.15) : theme.colorScheme.surfaceContainerHighest,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: isSelected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant, size: 24),
      ),
      title: Text(
        label,
        style: theme.textTheme.titleMedium?.copyWith(
          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
          color: isSelected ? theme.colorScheme.primary : null,
        ),
      ),
      subtitle: Text(
        address,
        style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: isSelected ? Icon(Icons.check_circle_rounded, color: theme.colorScheme.primary, size: 24) : null,
    );
  }
}

class _LocationTileLoading extends StatelessWidget {
  const _LocationTileLoading();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      leading: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: theme.colorScheme.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
        child: const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2)),
      ),
      title: Text('Fetching location...', style: theme.textTheme.titleMedium),
      subtitle: Text('Please wait', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
    );
  }
}
