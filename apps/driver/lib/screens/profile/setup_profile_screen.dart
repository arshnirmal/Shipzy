import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../../models/static/static_vehicle_category.dart';
import '../../services/api_service.dart';
import '../../services/cloudinary_service.dart';
import '../../utils/app_routes.dart';
import '../../utils/snackbar_utils.dart';
import '../auth/widgets/auth_widgets.dart';
import 'widgets/onboarding_widgets.dart';

class SetupProfileScreen extends ConsumerStatefulWidget {
  const SetupProfileScreen({super.key});

  @override
  ConsumerState<SetupProfileScreen> createState() => _SetupProfileScreenState();
}

class _SetupProfileScreenState extends ConsumerState<SetupProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _makeCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();

  XFile? _photo;
  bool _photoUploading = false;
  String? _photoUrl;
  int? _vehicleCategoryId;
  bool _submitting = false;
  bool _catalogLoading = true;
  List<StaticVehicleCategory> _vehicleOptions = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadVehicleCatalog());
  }

  @override
  void dispose() {
    _makeCtrl.dispose();
    _modelCtrl.dispose();
    _yearCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadVehicleCatalog() async {
    try {
      final rows = await ref.read(apiServiceProvider).getVehicleCategoryCatalog();
      if (!mounted) {
        return;
      }
      setState(() {
        _vehicleOptions = rows;
        _catalogLoading = false;
      });
    } catch (_) {
      if (mounted) {
        setState(() {
          _vehicleOptions = [];
          _catalogLoading = false;
        });
        SnackbarUtils.showError(context, 'Could not load vehicle types. Check connection and retry.');
      }
    }
  }

  Future<void> _pickPhoto() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 85, maxWidth: 800);
    if (picked == null || !mounted) {
      return;
    }
    setState(() {
      _photo = picked;
      _photoUploading = true;
    });
    try {
      final url = await ref.read(cloudinaryServiceProvider).uploadDocument(picked, folder: 'profile');
      if (mounted) {
        setState(() => _photoUrl = url);
      }
    } catch (_) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Photo upload failed. You can retry or continue without a photo.');
        setState(() => _photo = null);
      }
    } finally {
      if (mounted) {
        setState(() => _photoUploading = false);
      }
    }
  }

  Future<void> _onContinue() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    if (_vehicleCategoryId == null) {
      SnackbarUtils.showError(context, 'Please select a vehicle type');
      return;
    }
    setState(() => _submitting = true);
    try {
      await ref
          .read(apiServiceProvider)
          .submitVehicleDetails(
            vehicleCategoryId: _vehicleCategoryId!,
            vehicleMake: _makeCtrl.text.trim(),
            vehicleModel: _modelCtrl.text.trim(),
            vehicleYear: int.parse(_yearCtrl.text.trim()),
            plateNumber: _plateCtrl.text.trim().toUpperCase(),
            profilePictureUrl: _photoUrl,
          );
      if (mounted) {
        await context.push(AppRoutes.documentUpload);
      }
    } catch (_) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to save vehicle details. Please try again.');
      }
    } finally {
      if (mounted) {
        setState(() => _submitting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final tt = Theme.of(context).textTheme;
    final maxYear = DateTime.now().year;

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
                      Expanded(
                        child: Text('STEP 1 OF 2', style: tt.labelSmall?.copyWith(color: cs.onSurfaceVariant, letterSpacing: 0.8)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(color: cs.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                        child: Text(
                          '1/2',
                          style: tt.labelSmall?.copyWith(color: cs.primary, fontWeight: FontWeight.w700),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  const OnboardingProgressBar(currentStep: 1, totalSteps: 2),
                  const SizedBox(height: 20),
                  Text('Vehicle details', style: tt.headlineSmall),
                  const SizedBox(height: 4),
                  Text('Tell us about your vehicle', style: tt.bodyMedium),
                ],
              ),
            ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: ProfilePhotoPicker(imageFile: _photo, isLoading: _photoUploading, onPick: _pickPhoto),
                      ),
                      const SizedBox(height: 28),
                      if (_catalogLoading)
                        const Center(
                          child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()),
                        )
                      else if (_vehicleOptions.isEmpty)
                        Text('No vehicle categories available.', style: tt.bodyMedium?.copyWith(color: cs.error))
                      else
                        VehicleCategorySelector(
                          options: _vehicleOptions,
                          selectedCategoryId: _vehicleCategoryId,
                          onChanged: (id) => setState(() => _vehicleCategoryId = id),
                        ),
                      const SizedBox(height: 20),
                      AuthTextField(
                        controller: _makeCtrl,
                        label: 'VEHICLE MAKE',
                        hintText: 'e.g. Honda, Maruti',
                        labelDensity: AuthFieldLabelDensity.section,
                        textCapitalization: TextCapitalization.words,
                        validator: (v) => v == null || v.trim().isEmpty ? 'Vehicle make is required' : null,
                      ),
                      const SizedBox(height: 16),
                      AuthTextField(
                        controller: _modelCtrl,
                        label: 'VEHICLE MODEL',
                        hintText: 'e.g. Activa, Swift',
                        labelDensity: AuthFieldLabelDensity.section,
                        textCapitalization: TextCapitalization.words,
                        validator: (v) => v == null || v.trim().isEmpty ? 'Vehicle model is required' : null,
                      ),
                      const SizedBox(height: 16),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: AuthTextField(
                              controller: _yearCtrl,
                              label: 'YEAR',
                              hintText: '2021',
                              labelDensity: AuthFieldLabelDensity.section,
                              keyboardType: TextInputType.number,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                LengthLimitingTextInputFormatter(4),
                              ],
                              validator: (v) {
                                final y = int.tryParse(v ?? '');
                                if (y == null || y < 1990 || y > maxYear) {
                                  return 'Enter year (1990–$maxYear)';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AuthTextField(
                              controller: _plateCtrl,
                              label: 'PLATE NUMBER',
                              hintText: 'MH12AB1234',
                              labelDensity: AuthFieldLabelDensity.section,
                              textCapitalization: TextCapitalization.characters,
                              inputFormatters: [
                                FilteringTextInputFormatter.allow(RegExp('[A-Za-z0-9]')),
                                LengthLimitingTextInputFormatter(12),
                              ],
                              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      OnboardingPrimaryButton(
                        label: 'Continue',
                        onPressed: (_submitting || _photoUploading || _catalogLoading || _vehicleOptions.isEmpty) ? null : _onContinue,
                        isLoading: _submitting,
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
