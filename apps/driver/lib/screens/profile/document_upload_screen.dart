import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../providers/onboarding_gate_provider.dart';
import '../../services/api_service.dart';
import '../../services/cloudinary_service.dart';
import '../../theme/driver_app_theme.dart';
import '../../utils/app_routes.dart';
import '../../utils/snackbar_utils.dart';
import 'widgets/onboarding_widgets.dart';

class DocumentUploadScreen extends ConsumerStatefulWidget {
  const DocumentUploadScreen({super.key});

  @override
  ConsumerState<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends ConsumerState<DocumentUploadScreen> {
  final _urls = List<String?>.filled(3, null, growable: false);
  final _uploading = List<bool>.filled(3, false, growable: false);
  bool _submitting = false;

  static const _docs = [
    (title: 'Driving license', subtitle: 'Tap to upload from gallery', folder: 'license'),
    (title: 'Vehicle registration', subtitle: 'Tap to upload from gallery', folder: 'vehicle_reg'),
    (title: 'Insurance', subtitle: 'Tap to upload from gallery', folder: 'insurance'),
  ];

  bool get _allUploaded => _urls.every((u) => u != null);

  Future<void> _pickAndUpload(int i) async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 90);
    if (picked == null || !mounted) return;
    setState(() => _uploading[i] = true);
    try {
      final url = await ref.read(cloudinaryServiceProvider).uploadDocument(picked, folder: 'kyc/${_docs[i].folder}');
      if (mounted) {
        setState(() => _urls[i] = url);
        SnackbarUtils.showSuccess(context, '${_docs[i].title} uploaded');
      }
    } catch (_) {
      if (mounted) SnackbarUtils.showError(context, 'Upload failed. Please try again.');
    } finally {
      if (mounted) setState(() => _uploading[i] = false);
    }
  }

  Future<void> _onSubmit() async {
    if (!_allUploaded) {
      SnackbarUtils.showError(context, 'Please upload all 3 documents to continue');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref.read(apiServiceProvider).submitKycDocuments(
            licenseUrl: _urls[0]!,
            vehicleRegUrl: _urls[1]!,
            insuranceUrl: _urls[2]!,
          );
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(kDriverOnboardingStatusKey, kDriverOnboardingPendingReview);
      ref.invalidate(driverOnboardingStatusProvider);
      if (mounted) await _showSuccessAndNavigate();
    } catch (_) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Submission failed. Please try again.');
        setState(() => _submitting = false);
      }
    }
  }

  Future<void> _showSuccessAndNavigate() async {
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (_) => const _SuccessOverlay(),
    );
    if (mounted) context.go(AppRoutes.pendingReview);
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final uploadedCount = _urls.where((u) => u != null).length;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      IconButton.filledTonal(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back, size: 20),
                        style: IconButton.styleFrom(
                          visualDensity: VisualDensity.compact,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          'STEP 2 OF 2',
                          style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant, letterSpacing: 0.8),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: cs.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('2/2', style: tt.labelSmall?.copyWith(color: cs.primary, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const OnboardingProgressBar(currentStep: 2, totalSteps: 2),
                  const SizedBox(height: 20),
                  Text('Upload documents', style: tt.headlineSmall),
                  const SizedBox(height: 4),
                  Text('Required for verification', style: tt.bodyMedium),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                child: Column(
                  children: [
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: cs.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(Icons.info_outline, size: 20, color: cs.primary),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Upload clear, well-lit photos. Documents must be valid and fully legible.',
                                style: tt.bodySmall?.copyWith(height: 1.5),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    ...List.generate(
                      _docs.length,
                      (i) => Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: DocUploadCard(
                          title: _docs[i].title,
                          subtitle: _docs[i].subtitle,
                          isUploaded: _urls[i] != null,
                          isLoading: _uploading[i],
                          onTap: () => _pickAndUpload(i),
                          index: i,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      decoration: BoxDecoration(
                        color: _allUploaded ? cs.tertiaryContainer.withValues(alpha: 0.3) : cs.surfaceContainerLow,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _allUploaded ? cs.tertiary : cs.surfaceContainerHighest,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '$uploadedCount of ${_docs.length} documents uploaded',
                            style: tt.labelMedium?.copyWith(
                              color: _allUploaded ? cs.tertiary : cs.onSurfaceVariant,
                              letterSpacing: 0.3,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    OnboardingPrimaryButton(
                      label: 'Submit for verification',
                      onPressed: _submitting ? null : _onSubmit,
                      isLoading: _submitting,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SuccessOverlay extends StatefulWidget {
  const _SuccessOverlay();

  @override
  State<_SuccessOverlay> createState() => _SuccessOverlayState();
}

class _SuccessOverlayState extends State<_SuccessOverlay> with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<double> _scale;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    _scale = CurvedAnimation(parent: _ctrl, curve: Curves.elasticOut);
    _fade = CurvedAnimation(parent: _ctrl, curve: const Interval(0.4, 1, curve: Curves.easeIn));
    _ctrl.forward();
    Future<void>.delayed(const Duration(milliseconds: 1800), () {
      if (mounted) Navigator.of(context).pop();
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ScaleTransition(
            scale: _scale,
            child: Container(
              width: 88,
              height: 88,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: Theme.of(context).primaryGradient,
                boxShadow: [
                  BoxShadow(
                    color: cs.primary.withValues(alpha: 0.4),
                    blurRadius: 24,
                    spreadRadius: 4,
                  ),
                ],
              ),
              child: FadeTransition(
                opacity: _fade,
                child: const Icon(Icons.check_rounded, color: Colors.white, size: 44),
              ),
            ),
          ),
          const SizedBox(height: 20),
          FadeTransition(
            opacity: _fade,
            child: Text(
              'Documents submitted',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
