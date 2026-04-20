import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/driver_kyc_submission.dart';
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
        if (vehicle != null &&
            ((vehicle.specification?.model?.trim().isNotEmpty ?? false) ||
                (vehicle.specification?.vehicleNumber?.trim().isNotEmpty ?? false) ||
                (vehicle.category?.name?.trim().isNotEmpty ?? false)))
          ListTile(
            leading: const Icon(Icons.directions_car_outlined),
            title: Text(_vehicleListTitle(vehicle)),
            subtitle: _vehicleListSubtitle(vehicle),
          ),
        ..._verificationSection(context, profile),
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

String _vehicleListTitle(DriverVehicle v) {
  final model = v.specification?.model?.trim();
  if (model != null && model.isNotEmpty) {
    return model;
  }
  final plate = v.specification?.vehicleNumber?.trim();
  if (plate != null && plate.isNotEmpty) {
    return plate;
  }
  final cat = v.category?.name?.trim();
  if (cat != null && cat.isNotEmpty) {
    return cat;
  }
  return 'Vehicle';
}

Widget? _vehicleListSubtitle(DriverVehicle v) {
  final title = _vehicleListTitle(v);
  final lines = <String>[];
  final plate = v.specification?.vehicleNumber?.trim();
  final cat = v.category?.name?.trim();
  if (plate != null && plate.isNotEmpty && plate != title) {
    lines.add(plate);
  }
  if (cat != null && cat.isNotEmpty && cat != title) {
    lines.add(cat);
  }
  final maxW = v.category?.maxWeightKg;
  if (maxW != null) {
    lines.add('max ${maxW.toStringAsFixed(0)} kg');
  }
  if (lines.isEmpty) {
    return null;
  }
  return Text(lines.join(' · '));
}

String _formatIsoDate(String? iso) {
  if (iso == null || iso.isEmpty) {
    return '';
  }
  final parsed = DateTime.tryParse(iso);
  if (parsed == null) {
    return iso;
  }
  final local = parsed.toLocal();
  final y = local.year.toString().padLeft(4, '0');
  final m = local.month.toString().padLeft(2, '0');
  final d = local.day.toString().padLeft(2, '0');
  return '$y-$m-$d';
}

String _onboardingSubtitle(ProfileOnboardingState o) {
  final lines = <String>[
    if (o.stepsCompleted.isNotEmpty) 'Steps: ${o.stepsCompleted.join(', ')}',
    if (o.submittedAt != null && o.submittedAt!.isNotEmpty) 'Submitted: ${_formatIsoDate(o.submittedAt)}',
    if (o.approvedAt != null && o.approvedAt!.isNotEmpty) 'Approved: ${_formatIsoDate(o.approvedAt)}',
  ];
  return lines.isEmpty ? '—' : lines.join('\n');
}

String _onboardingStatusLabel(String? status) {
  switch (status) {
    case 'pending_review':
      return 'Pending review';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'incomplete':
      return 'Incomplete';
    default:
      return status == null || status.isEmpty ? 'Not started' : status;
  }
}

Future<void> _openDocumentUrl(BuildContext context, String url) async {
  final uri = Uri.tryParse(url);
  if (uri == null) {
    return;
  }
  final launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!launched && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Could not open link')),
    );
  }
}

List<Widget> _verificationSection(BuildContext context, DriverProfile profile) {
  final o = profile.onboarding;
  final kyc = profile.kyc;
  if (o == null && kyc == null) {
    return [];
  }

  final children = <Widget>[
    const Divider(),
    Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
      child: Text(
        'Verification',
        style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
      ),
    ),
    ListTile(
      leading: const Icon(Icons.fact_check_outlined),
      title: Text(_onboardingStatusLabel(o?.status)),
      subtitle: o == null
          ? const Text('Submit documents from the onboarding flow when prompted.')
          : Text(_onboardingSubtitle(o)),
    ),
  ];

  final rejectedReason = o?.rejectedReason?.trim();
  if (rejectedReason != null && rejectedReason.isNotEmpty) {
    children.add(
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Material(
          color: Theme.of(context).colorScheme.errorContainer.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Text(
              rejectedReason,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ),
      ),
    );
  }

  void addDocTile(String label, String? url) {
    if (url == null || url.isEmpty) {
      return;
    }
    children.add(
      ListTile(
        leading: const Icon(Icons.insert_drive_file_outlined),
        title: Text(label),
        subtitle: const Text('View uploaded file'),
        trailing: const Icon(Icons.open_in_new, size: 20),
        onTap: () => _openDocumentUrl(context, url),
      ),
    );
  }

  addDocTile('Driver license', kyc?.license?.url);
  addDocTile('Vehicle registration', kyc?.vehicleReg?.url);
  addDocTile('Insurance', kyc?.insurance?.url);

  return children;
}
