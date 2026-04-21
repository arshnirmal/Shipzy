import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/driver_kyc_submission.dart';
import '../../models/driver_profile.dart';
import '../../providers/auth_provider.dart';
import '../../providers/home_provider.dart';
import '../../theme/design_tokens.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(driverProfileProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: profileAsync.when(
        data: (profile) => _ProfileBody(profile: profile),
        loading: () => const _ProfileLoadingView(),
        error: (e, _) => _ProfileErrorView(
          message: '$e',
          onRetry: () {
            ref.invalidate(driverProfileProvider);
            ref.invalidate(activeOrderProvider);
          },
        ),
      ),
    );
  }
}

class _ProfileLoadingView extends StatelessWidget {
  const _ProfileLoadingView();

  @override
  Widget build(BuildContext context) {
    final tt = Theme.of(context).textTheme;
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Semantics(
              label: 'Loading profile',
              child: SizedBox(
                width: 36,
                height: 36,
                child: CircularProgressIndicator(strokeWidth: 3, color: cs.primary),
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text('Loading your profile…', style: tt.titleMedium, textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Fetching courier details and status.',
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileErrorView extends StatelessWidget {
  const _ProfileErrorView({required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_outlined, size: 56, color: cs.onSurfaceVariant),
            const SizedBox(height: AppSpacing.md),
            Text('Couldn’t load profile', style: tt.titleLarge, textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              style: tt.bodySmall?.copyWith(color: cs.onSurfaceVariant),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpacing.lg),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Try again'),
            ),
          ],
        ),
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

    final cs = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(driverProfileProvider);
        ref.invalidate(activeOrderProvider);
        final _ = await ref.refresh(driverProfileProvider.future);
      },
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Semantics(
              header: true,
              child: Material(
                color: cs.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    children: [
                      CircleAvatar(
                        radius: 40,
                        backgroundImage: profile.profilePictureUrl != null ? NetworkImage(profile.profilePictureUrl!) : null,
                        child: profile.profilePictureUrl == null ? Icon(Icons.person, size: 40, color: cs.onPrimaryContainer) : null,
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(profile.fullName, style: Theme.of(context).textTheme.titleLarge),
                      if (profile.email != null) Text(profile.email!, style: Theme.of(context).textTheme.bodyMedium),
                      if (profile.phoneNumber != null) Text(profile.phoneNumber!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ),
                ),
              ),
            ),
          ),
        if (profile.isVerified)
          SliverToBoxAdapter(
            child: ListTile(
              leading: Icon(Icons.verified, color: cs.primary),
              title: const Text('Verified driver'),
            ),
          )
        else
          SliverToBoxAdapter(
            child: ListTile(
              leading: Icon(Icons.hourglass_top_outlined, color: cs.tertiary),
              title: const Text('Verification in progress'),
              subtitle: Text(
                _unverifiedSubtitle(profile),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ),
          ),
        if (rating != null && rating.totalRatings > 0)
          SliverToBoxAdapter(
            child: ListTile(
              leading: const Icon(Icons.star_outline),
              title: Text('${rating.averageRating.toStringAsFixed(1)} / 5.0'),
              subtitle: Text('${rating.totalRatings} ratings'),
            ),
          ),
        if (_vehicleRowVisible(vehicle))
          SliverToBoxAdapter(
            child: ListTile(
              leading: const Icon(Icons.directions_car_outlined),
              title: Text(_vehicleListTitle(vehicle!)),
              subtitle: _vehicleListSubtitle(vehicle),
            ),
          ),
        ..._verificationSectionSlivers(context, profile),
        const SliverToBoxAdapter(child: Divider(height: 1)),
        SliverToBoxAdapter(
          child: ListTile(
            leading: Icon(Icons.logout, color: cs.error),
            title: Text('Log out', style: TextStyle(color: cs.error, fontWeight: FontWeight.w600)),
            onTap: () => ref.read(authProvider.notifier).signOut(),
          ),
        ),
        ],
      ),
    );
  }
}

bool _vehicleRowVisible(DriverVehicle? vehicle) {
  if (vehicle == null) {
    return false;
  }
  final spec = vehicle.specification;
  final cat = vehicle.category;
  final hasSpec = (spec?.model?.trim().isNotEmpty ?? false) ||
      (spec?.vehicleNumber?.trim().isNotEmpty ?? false) ||
      (spec?.year != null);
  final hasCat = (cat?.name?.trim().isNotEmpty ?? false) || (cat?.id != null);
  return hasSpec || hasCat;
}

String _unverifiedSubtitle(DriverProfile profile) {
  final o = profile.onboarding?.status;
  switch (o) {
    case 'pending_review':
      return 'Your documents are with our team. We will notify you when verification finishes.';
    case 'rejected':
      return 'Please review the reason below and resubmit from the onboarding flow if needed.';
    case 'incomplete':
      return 'Finish vehicle details and document upload from the onboarding steps.';
    default:
      return 'Complete onboarding to become a verified courier.';
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

List<Widget> _verificationSectionSlivers(BuildContext context, DriverProfile profile) {
  final o = profile.onboarding;
  final kyc = profile.kyc;
  final showForUnverified = !profile.isVerified;
  if (!showForUnverified && o == null && kyc == null) {
    return [];
  }

  final cs = Theme.of(context).colorScheme;
  final out = <Widget>[
    const SliverToBoxAdapter(child: Divider(height: 1)),
    SliverToBoxAdapter(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.xs, AppSpacing.md, 0),
        child: Text(
          'Verification',
          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
        ),
      ),
    ),
    SliverToBoxAdapter(
      child: ListTile(
        leading: const Icon(Icons.fact_check_outlined),
        title: Text(_onboardingStatusLabel(o?.status)),
        subtitle: o == null
            ? const Text('Submit documents from the onboarding flow when prompted.')
            : Text(_onboardingSubtitle(o)),
      ),
    ),
  ];

  final rejectedReason = o?.rejectedReason?.trim();
  if (rejectedReason != null && rejectedReason.isNotEmpty) {
    out.add(
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
          child: Material(
            color: cs.errorContainer.withValues(alpha: 0.45),
            borderRadius: BorderRadius.circular(AppSpacing.sm),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Text(rejectedReason, style: Theme.of(context).textTheme.bodyMedium),
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
    out.add(
      SliverToBoxAdapter(
        child: ListTile(
          leading: const Icon(Icons.insert_drive_file_outlined),
          title: Text(label),
          subtitle: const Text('Open uploaded file'),
          trailing: Icon(Icons.open_in_new, size: 20, color: cs.primary),
          onTap: () => _openDocumentUrl(context, url),
        ),
      ),
    );
  }

  addDocTile('Driver license', kyc?.license?.url);
  addDocTile('Vehicle registration', kyc?.vehicleReg?.url);
  addDocTile('Insurance', kyc?.insurance?.url);

  return out;
}
