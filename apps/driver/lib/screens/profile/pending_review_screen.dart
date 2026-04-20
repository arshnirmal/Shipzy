import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../theme/driver_app_theme.dart';
import '../../utils/snackbar_utils.dart';

class PendingReviewScreen extends StatelessWidget {
  const PendingReviewScreen({super.key});

  static final _supportUri = Uri.parse('mailto:support@shipzy.com?subject=Driver%20verification');

  Future<void> _openSupport(BuildContext context) async {
    if (await canLaunchUrl(_supportUri)) {
      await launchUrl(_supportUri);
    } else if (context.mounted) {
      SnackbarUtils.showInfo(context, 'Could not open email. Contact support at support@shipzy.com');
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              DecoratedBox(
                decoration: BoxDecoration(gradient: Theme.of(context).primaryGradient),
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
                      padding: const EdgeInsets.fromLTRB(24, 28, 24, 36),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
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
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'VERIFICATION STEPS',
                      style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant, letterSpacing: 0.8),
                    ),
                    const SizedBox(height: 14),
                    const _VerificationTimeline(),
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
                              child: Icon(Icons.schedule_outlined, color: cs.primary, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Estimated time', style: tt.titleSmall),
                                  Text('24–48 business hours', style: tt.bodySmall),
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
                        onTap: () => _openSupport(context),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: cs.outlineVariant.withValues(alpha: 0.35)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.mail_outline, size: 20, color: cs.primary),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Need help?', style: tt.titleSmall),
                                    Text('Email driver support', style: tt.bodySmall),
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
    );
  }
}

class _VerificationTimeline extends StatelessWidget {
  const _VerificationTimeline();

  static const _steps = [
    (label: 'Application received', sub: 'Your details have been recorded', done: true, active: false),
    (label: 'Document review', sub: 'We are verifying your documents', done: false, active: true),
    (label: 'Background check', sub: 'Standard security verification', done: false, active: false),
    (label: 'Approval', sub: 'You can start accepting trips', done: false, active: false),
  ];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    return Column(
      children: List.generate(_steps.length, (i) {
        final s = _steps[i];
        final isLast = i == _steps.length - 1;
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
                        ? [BoxShadow(color: cs.primary.withValues(alpha: 0.35), blurRadius: 8, spreadRadius: 1)]
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
                        color: (s.done || s.active) ? cs.onSurface : cs.onSurfaceVariant,
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

class _PulsingDotState extends State<_PulsingDot> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _scale = Tween<double>(begin: 0.85, end: 1.15).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ScaleTransition(
        scale: _scale,
        child: Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(shape: BoxShape.circle, color: widget.color),
        ),
      );
}
