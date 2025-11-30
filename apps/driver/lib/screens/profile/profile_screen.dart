import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shipzy_driver/providers/auth_provider.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        children: [
          const UserAccountsDrawerHeader(
            accountName: Text('John Doe'),
            accountEmail: Text('john.doe@example.com'),
            currentAccountPicture: CircleAvatar(child: Icon(Icons.person, size: 40)),
          ),
          ListTile(leading: const Icon(Icons.person_outline), title: const Text('Edit Profile'), onTap: () {}),
          ListTile(leading: const Icon(Icons.directions_car_outlined), title: const Text('Vehicle Information'), onTap: () {}),
          ListTile(leading: const Icon(Icons.description_outlined), title: const Text('Documents'), onTap: () {}),
          ListTile(leading: const Icon(Icons.settings_outlined), title: const Text('Settings'), onTap: () {}),
          ListTile(leading: const Icon(Icons.help_outline), title: const Text('Help & Support'), onTap: () {}),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () {
              ref.read(authProvider.notifier).signOut();
            },
          ),
        ],
      ),
    );
  }
}
