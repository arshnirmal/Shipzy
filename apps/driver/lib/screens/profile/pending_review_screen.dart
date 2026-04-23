import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/driver_kyc_submission.dart';
import '../../models/driver_profile.dart';
import '../../providers/home_provider.dart';
import '../../theme/app_theme.dart';
import '../../theme/design_tokens.dart';
import '../../utils/snackbar_utils.dart';

final Uri _supportUri = Uri.parse(
  'mailto:support@shipzy.com?subject=Driver%20verification',
);

Future<void> _openPendingReviewSupport(BuildContext context) async {
  if (await canLaunchUrl(_supportUri)) {
    await launchUrl(_supportUri);
  } else if (context.mounted) {
    SnackbarUtils.showInfo(
      context,
      'Could not open email. Contact support at support@shipzy.com',
    );
  }
}

class PendingReviewScreen extends ConsumerWidget {
  const PendingReviewScreen({super.key});

  Future<void> _refreshProfile(WidgetRef ref) async {
    ref.invalidate(driverProfileProvider);
    ref.invalidate(activeOrderProvider);
    final _ = await ref.refresh(driverProfileProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(driverProfileProvider);
    return profileAsync.when(
      loading: () => const _PendingReviewSkeletonView(),
      error: (_, __) => _PendingReviewScaffold(
        profile: null,
        onSupport: () => _openPendingReviewSupport(context),
        onRefresh: () => _refreshProfile(ref),
      ),
      data: (profile) => _PendingReviewScaffold(
        profile: profile,
        onSupport: () => _openPendingReviewSupport(context),
        onRefresh: () => _refreshProfile(ref),
      ),
    );
  }
}

/// Content-shaped placeholders (Material 3 “loading” pattern) while profile loads.
class _PendingReviewSkeletonView extends StatelessWidget {
  const _PendingReviewSkeletonView();

  static Widget _bone(
    BuildContext context, {
    required double width,
    required double height,
    BorderRadius? radius,
  }) => Container(
    width: width,
    height: height,
    decoration: BoxDecoration(
      color: Theme.of(
        context,
      ).colorScheme.surfaceContainerHighest.withValues(alpha: 0.85),
      borderRadius: radius ?? BorderRadius.circular(8),
    ),
  );

  @override
  Widget build(BuildContext context) => Semantics(
    label: 'Loading application status',
    child: Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(
                  gradient: Theme.of(context).primaryGradient,
                ),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.lg,
                    28,
                    AppSpacing.lg,
                    36,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _bone(
                        context,
                        width: 140,
                        height: 32,
                        radius: BorderRadius.circular(20),
                      ),
                      const SizedBox(height: 16),
                      _bone(
                        context,
                        width: 260,
                        height: 28,
                        radius: BorderRadius.circular(6),
                      ),
                      const SizedBox(height: 10),
                      _bone(
                        context,
                        width: double.infinity,
                        height: 16,
                        radius: BorderRadius.circular(4),
                      ),
                      const SizedBox(height: 8),
                      _bone(
                        context,
                        width: 220,
                        height: 16,
                        radius: BorderRadius.circular(4),
                      ),
                    ],
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(AppSpacing.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _bone(
                      context,
                      width: 120,
                      height: 12,
                      radius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 12),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 88,
                      radius: BorderRadius.circular(12),
                    ),
                    const SizedBox(height: 24),
                    _bone(
                      context,
                      width: 140,
                      height: 12,
                      radius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 14),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 56,
                      radius: BorderRadius.circular(10),
                    ),
                    const SizedBox(height: 10),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 56,
                      radius: BorderRadius.circular(10),
                    ),
                    const SizedBox(height: 10),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 56,
                      radius: BorderRadius.circular(10),
                    ),
                    const SizedBox(height: 20),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 72,
                      radius: BorderRadius.circular(12),
                    ),
                    const SizedBox(height: 12),
                    _bone(
                      context,
                      width: double.infinity,
                      height: 56,
                      radius: BorderRadius.circular(12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

class _PendingReviewScaffold extends StatelessWidget {
  const _PendingReviewScaffold({
    required this.profile,
    required this.onSupport,
    required this.onRefresh,
  });

  final DriverProfile? profile;
  final VoidCallback onSupport;
  final Future<void> Function() onRefresh;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          onRefresh: onRefresh,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DecoratedBox(
                  decoration: BoxDecoration(
                    gradient: Theme.of(context).primaryGradient,
                  ),
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Positioned(
                        top: -40,
                        right: -40,
                        child: Container(
                          width: 130,
                          height: 130,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.08),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: -20,
                        right: 40,
                        child: Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withValues(alpha: 0.06),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.fromLTRB(
                          AppSpacing.lg,
                          28,
                          AppSpacing.lg,
                          36,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            DecoratedBox(
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.18),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 6,
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const _PulsingDot(color: Color(0xFFFFD700)),
                                    const SizedBox(width: 8),
                                    Text(
                                      'UNDER REVIEW',
                                      style: tt.labelSmall?.copyWith(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        letterSpacing: 0.7,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Application submitted',
                              style: tt.headlineMedium?.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                height: 1.2,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Our team will verify your documents within 24–48 hours.',
                              style: tt.bodyMedium?.copyWith(
                                color: Colors.white.withValues(alpha: 0.9),
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.lg),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (profile case final p?) ...[
                        Text(
                          'YOUR SUBMISSION',
                          style: tt.labelSmall?.copyWith(
                            color: cs.onSurfaceVariant,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _SubmissionSummaryCard(profile: p),
                        const SizedBox(height: 24),
                      ],
                      Text(
                        'VERIFICATION STEPS',
                        style: tt.labelSmall?.copyWith(
                          color: cs.onSurfaceVariant,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 14),
                      _VerificationTimeline(onboarding: profile?.onboarding),
                      const SizedBox(height: 20),
                      DecoratedBox(
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Row(
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: cs.surface,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Icon(
                                  Icons.schedule_outlined,
                                  color: cs.primary,
                                  size: 24,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Estimated time',
                                      style: tt.titleSmall,
                                    ),
                                    Text(
                                      '24–48 business hours',
                                      style: tt.bodySmall,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Material(
                        color: cs.surface,
                        borderRadius: BorderRadius.circular(12),
                        child: InkWell(
                          onTap: onSupport,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: cs.outlineVariant.withValues(
                                  alpha: 0.35,
                                ),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  Icons.mail_outline,
                                  size: 20,
                                  color: cs.primary,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text('Need help?', style: tt.titleSmall),
                                      Text(
                                        'Email driver support',
                                        style: tt.bodySmall,
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(Icons.chevron_right, color: cs.primary),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SubmissionSummaryCard extends StatelessWidget {
  const _SubmissionSummaryCard({required this.profile});

  final DriverProfile profile;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final v = profile.vehicle;
    final spec = v?.specification;
    final cat = v?.category;
    final plate = spec?.vehicleNumber?.trim();
    final model = spec?.model?.trim();
    final year = spec?.year;
    final catName = cat?.name?.trim();
    final lines = <String>[
      if (plate != null && plate.isNotEmpty) 'Plate: $plate',
      if (model != null && model.isNotEmpty) 'Vehicle: $model',
      if (year != null) 'Year: $year',
      if (catName != null && catName.isNotEmpty) 'Category: $catName',
    ];
    final o = profile.onboarding;
    final submitted = o?.submittedAt;
    final stepsDone = o?.stepsCompleted;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.35)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.local_shipping_outlined,
                  size: 22,
                  color: cs.primary,
                ),
                const SizedBox(width: 8),
                Text('Vehicle & documents', style: tt.titleSmall),
              ],
            ),
            if (lines.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'Details will appear here once synced from your profile.',
                  style: tt.bodySmall,
                ),
              )
            else
              Padding(
                padding: const EdgeInsets.only(top: 10),
                child: Text(
                  lines.join('\n'),
                  style: tt.bodySmall?.copyWith(height: 1.45),
                ),
              ),
            if (submitted != null && submitted.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                'Submitted ${_formatIsoDate(submitted)}',
                style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant),
              ),
            ],
            if (stepsDone != null && stepsDone.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                'Steps: ${stepsDone.join(', ')}',
                style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

String _formatIsoDate(String iso) {
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

class _VerificationTimeline extends StatelessWidget {
  const _VerificationTimeline({this.onboarding});

  final ProfileOnboardingState? onboarding;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final pending = onboarding?.status == 'pending_review';
    final steps = <({String label, String sub, bool done, bool active})>[
      (
        label: 'Application received',
        sub: 'Your details have been recorded',
        done: true,
        active: false,
      ),
      (
        label: 'Document review',
        sub: pending
            ? 'We are verifying your uploaded documents'
            : 'We will verify your documents',
        done: false,
        active: pending,
      ),
      (
        label: 'Background check',
        sub: 'Standard security verification',
        done: false,
        active: false,
      ),
      (
        label: 'Approval',
        sub: 'You can start accepting trips',
        done: false,
        active: false,
      ),
    ];

    return Column(
      children: List.generate(steps.length, (i) {
        final s = steps[i];
        final isLast = i == steps.length - 1;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 28,
                  height: 28,
                  margin: const EdgeInsets.only(top: 4),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: s.done
                        ? cs.tertiary
                        : s.active
                        ? cs.primary
                        : cs.surfaceContainerHighest,
                    boxShadow: s.active
                        ? [
                            BoxShadow(
                              color: cs.primary.withValues(alpha: 0.35),
                              blurRadius: 8,
                              spreadRadius: 1,
                            ),
                          ]
                        : null,
                  ),
                  child: s.done
                      ? const Icon(Icons.check, color: Colors.white, size: 14)
                      : s.active
                      ? const Center(child: _PulsingDot(color: Colors.white))
                      : null,
                ),
                if (!isLast)
                  Container(
                    width: 2,
                    height: 36,
                    margin: const EdgeInsets.symmetric(vertical: 2),
                    decoration: BoxDecoration(
                      color: s.done ? cs.tertiary : cs.surfaceContainerHighest,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: EdgeInsets.only(bottom: isLast ? 0 : 20, top: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s.label,
                      style: tt.titleSmall?.copyWith(
                        color: (s.done || s.active)
                            ? cs.onSurface
                            : cs.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(s.sub, style: tt.bodySmall),
                  ],
                ),
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot({required this.color});

  final Color color;

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _scale = Tween<double>(
      begin: 0.85,
      end: 1.15,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) {
        return;
      }
      final mq = MediaQuery.maybeOf(context);
      if (mq != null && !mq.disableAnimations) {
        _ctrl.repeat(reverse: true);
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dot = Container(
      width: 8,
      height: 8,
      decoration: BoxDecoration(shape: BoxShape.circle, color: widget.color),
    );
    if (MediaQuery.of(context).disableAnimations) {
      return dot;
    }
    return ScaleTransition(scale: _scale, child: dot);
  }
}
