import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../models/driver_profile.dart';
import '../../providers/auth_provider.dart';
import '../../providers/home_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(driverProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: profileAsync.when(
        data: (profile) => _ProfileBody(profile: profile),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error loading profile: $e')),
      ),
    );
  }
}

class _ProfileBody extends ConsumerWidget {
  const _ProfileBody({required this.profile});

  final DriverProfile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rating = profile.rating;
    final vehicle = profile.vehicle;
    final vehicleModel = vehicle?.model;

    return ListView(
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          color: Theme.of(context).colorScheme.primaryContainer,
          child: Column(
            children: [
              CircleAvatar(
                radius: 40,
                backgroundImage: profile.profilePictureUrl != null ? NetworkImage(profile.profilePictureUrl!) : null,
                child: profile.profilePictureUrl == null ? const Icon(Icons.person, size: 40) : null,
              ),
              const SizedBox(height: 12),
              Text(profile.fullName, style: Theme.of(context).textTheme.titleLarge),
              if (profile.email != null) Text(profile.email!, style: Theme.of(context).textTheme.bodyMedium),
              if (profile.phoneNumber != null) Text(profile.phoneNumber!, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ),
        if (profile.isVerified)
          const ListTile(
            leading: Icon(Icons.verified, color: Colors.green),
            title: Text('Verified Driver'),
          ),
        if (rating != null && rating.totalRatings > 0)
          ListTile(
            leading: const Icon(Icons.star_outline),
            title: Text('${rating.averageRating.toStringAsFixed(1)} / 5.0'),
            subtitle: Text('${rating.totalRatings} ratings'),
          ),
        if (vehicleModel != null)
          ListTile(
            leading: const Icon(Icons.directions_car_outlined),
            title: Text(vehicleModel),
            subtitle: vehicle?.vehicleNumber != null ? Text(vehicle!.vehicleNumber!) : null,
          ),
        const Divider(),
        ListTile(
          leading: const Icon(Icons.logout, color: Colors.red),
          title: const Text('Logout', style: TextStyle(color: Colors.red)),
          onTap: () => ref.read(authProvider.notifier).signOut(),
        ),
      ],
    );
  }
}
