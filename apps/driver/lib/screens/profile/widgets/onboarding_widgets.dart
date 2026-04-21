import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../models/static/static_vehicle_category.dart';
import '../../../theme/app_theme.dart';
import '../../../theme/design_tokens.dart';

class OnboardingProgressBar extends StatelessWidget {
  const OnboardingProgressBar({required this.currentStep, required this.totalSteps, super.key});

  final int currentStep;
  final int totalSteps;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fraction = totalSteps <= 0 ? 0.0 : currentStep.clamp(0, totalSteps) / totalSteps;
    return Semantics(
      label: 'Onboarding progress, step $currentStep of $totalSteps',
      value: '${(fraction * 100).round()} percent',
      child: Row(
        children: List.generate(totalSteps, (i) {
          final filled = i < currentStep;
          return Expanded(
            child: Container(
              height: 5,
              margin: EdgeInsets.only(right: i < totalSteps - 1 ? AppSpacing.xs - 2 : 0),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(3),
                gradient: filled ? Theme.of(context).primaryGradient : null,
                color: filled ? null : cs.surfaceContainerHighest,
              ),
            ),
          );
        }),
      ),
    );
  }
}

class ProfilePhotoPicker extends StatelessWidget {
  const ProfilePhotoPicker({
    required this.imageFile,
    required this.onPick,
    this.networkPreviewUrl,
    this.isLoading = false,
    super.key,
  });

  final XFile? imageFile;
  /// Shown when [imageFile] is null (e.g. server profile photo after resume).
  final String? networkPreviewUrl;
  final VoidCallback onPick;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final hasLocal = imageFile != null;
    final url = networkPreviewUrl?.trim();
    final hasRemote = url != null && url.isNotEmpty;
    final hasPhoto = hasLocal || hasRemote;

    Widget avatarFace() {
      if (isLoading) {
        return Padding(
          padding: const EdgeInsets.all(28),
          child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
        );
      }
      if (hasLocal) {
        return ClipOval(child: Image.file(File(imageFile!.path), fit: BoxFit.cover));
      }
      if (hasRemote) {
        return ClipOval(
          child: Image.network(
            url,
            fit: BoxFit.cover,
            width: 90,
            height: 90,
            loadingBuilder: (context, child, progress) {
              if (progress == null) {
                return child;
              }
              return Center(
                child: SizedBox(
                  width: 28,
                  height: 28,
                  child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
                ),
              );
            },
            errorBuilder: (_, __, ___) => Icon(Icons.broken_image_outlined, size: 36, color: cs.onSurfaceVariant),
          ),
        );
      }
      return Icon(Icons.camera_alt_outlined, size: 32, color: cs.onSurfaceVariant);
    }

    return Column(
      children: [
        Semantics(
          button: true,
          label: hasPhoto ? 'Profile photo, tap to change' : 'Add profile photo',
          hint: 'Opens gallery',
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: isLoading ? null : onPick,
              customBorder: const CircleBorder(),
              child: SizedBox(
                width: AppSpacing.minTouchTarget + 42,
                height: AppSpacing.minTouchTarget + 42,
                child: Center(
                  child: Stack(
                    clipBehavior: Clip.none,
                    children: [
                      Container(
                        width: 90,
                        height: 90,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: hasPhoto ? cs.primaryContainer.withValues(alpha: 0.3) : cs.surfaceContainerHigh,
                          border: Border.all(
                            color: hasPhoto ? cs.primary : cs.outlineVariant,
                            width: hasPhoto ? 2.5 : 1.5,
                          ),
                        ),
                        child: avatarFace(),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: Theme.of(context).primaryGradient,
                            boxShadow: [Theme.of(context).ambientShadow],
                          ),
                          child: const Padding(
                            padding: EdgeInsets.all(6),
                            child: Icon(Icons.add, size: 16, color: Colors.white),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          hasPhoto ? 'Photo added' : 'Add profile photo',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(color: hasPhoto ? cs.primary : cs.onSurfaceVariant),
        ),
        Text(
          'Tap to choose from gallery',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: cs.onSurfaceVariant),
        ),
      ],
    );
  }
}

class VehicleCategorySelector extends StatelessWidget {
  const VehicleCategorySelector({
    required this.options,
    required this.selectedCategoryId,
    required this.onChanged,
    super.key,
  });

  final List<StaticVehicleCategory> options;
  final int? selectedCategoryId;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'VEHICLE TYPE',
          style: Theme.of(context).textTheme.labelSmall?.copyWith(color: cs.onSurfaceVariant, letterSpacing: 0.8),
        ),
        const SizedBox(height: 8),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: options.map((cat) {
              final label = cat.displayName ?? cat.name;
              final icon = vehicleCategoryIcon(label, cat.name);
              final isSel = selectedCategoryId == cat.categoryId;
              return Padding(
                padding: const EdgeInsets.only(right: AppSpacing.xs),
                child: ConstrainedBox(
                  constraints: const BoxConstraints(minWidth: 96, maxWidth: 120),
                  child: Semantics(
                    button: true,
                    selected: isSel,
                    label: 'Vehicle type $label',
                    child: Material(
                      color: Colors.transparent,
                      child: InkWell(
                        onTap: () => onChanged(cat.categoryId),
                        borderRadius: BorderRadius.circular(12),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
                          decoration: BoxDecoration(
                            color: isSel ? cs.primary.withValues(alpha: 0.1) : cs.surfaceContainerLow,
                            borderRadius: BorderRadius.circular(12),
                            border: isSel ? Border.all(color: cs.primary, width: 2) : null,
                          ),
                          child: Column(
                            children: [
                              Icon(icon, size: 28, color: isSel ? cs.primary : cs.onSurfaceVariant),
                              const SizedBox(height: 6),
                              Text(
                                label,
                                textAlign: TextAlign.center,
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                      color: isSel ? cs.primary : cs.onSurfaceVariant,
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}

class DocUploadCard extends StatelessWidget {
  const DocUploadCard({
    required this.title,
    required this.subtitle,
    required this.isUploaded,
    required this.isLoading,
    required this.onTap,
    required this.index,
    super.key,
  });

  final String title;
  final String subtitle;
  final bool isUploaded;
  final bool isLoading;
  final VoidCallback onTap;
  final int index;

  static const _icons = [Icons.badge_outlined, Icons.directions_car_outlined, Icons.security_outlined];

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: title,
      hint: isUploaded ? 'Document uploaded, tap to replace' : subtitle,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: isLoading ? null : onTap,
          borderRadius: BorderRadius.circular(12),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            constraints: const BoxConstraints(minHeight: AppSpacing.minTouchTarget + 8),
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: isUploaded ? cs.tertiaryContainer.withValues(alpha: 0.3) : cs.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
              border: isUploaded ? Border.all(color: cs.tertiary.withValues(alpha: 0.4), width: 1.5) : null,
            ),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: isUploaded ? cs.tertiaryContainer.withValues(alpha: 0.5) : cs.surface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(_icons[index.clamp(0, 2)], color: isUploaded ? cs.tertiary : cs.primary, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: Theme.of(context).textTheme.titleSmall),
                      const SizedBox(height: 2),
                      Text(
                        isUploaded ? 'Document uploaded' : subtitle,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: isUploaded ? cs.tertiary : cs.onSurfaceVariant,
                            ),
                      ),
                    ],
                  ),
                ),
                if (isLoading)
                  SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: cs.primary),
                  )
                else
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: isUploaded ? cs.tertiary : cs.surfaceContainerHighest,
                    ),
                    child: Icon(
                      isUploaded ? Icons.check : Icons.upload_outlined,
                      size: 14,
                      color: isUploaded ? Colors.white : cs.onSurfaceVariant,
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

class OnboardingPrimaryButton extends StatelessWidget {
  const OnboardingPrimaryButton({
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    super.key,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final disabled = onPressed == null || isLoading;
    return Semantics(
      button: true,
      label: label,
      enabled: !disabled,
      child: SizedBox(
        width: double.infinity,
        height: AppSpacing.minTouchTarget + 8,
        child: DecoratedBox(
          decoration: BoxDecoration(
            gradient: disabled ? null : Theme.of(context).primaryGradient,
            color: disabled ? cs.surfaceContainerHighest : null,
            borderRadius: BorderRadius.circular(12),
            boxShadow: disabled ? [] : [Theme.of(context).ambientShadow],
          ),
          child: ElevatedButton(
            onPressed: disabled ? null : onPressed,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: isLoading
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(
                      strokeWidth: 2.5,
                      valueColor: AlwaysStoppedAnimation<Color>(cs.onPrimary),
                    ),
                  )
                : Text(
                    label,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: disabled ? cs.onSurfaceVariant : cs.onPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                  ),
          ),
        ),
      ),
    );
  }
}

IconData vehicleCategoryIcon(String displayName, String? name) {
  final s = '$displayName ${name ?? ''}'.toLowerCase();
  if (s.contains('2-wheeler') || s.contains('2_wheeler') || s.contains('bike')) {
    return Icons.two_wheeler;
  }
  if (s.contains('3-wheeler') || s.contains('3_wheeler') || s.contains('auto')) {
    return Icons.local_taxi;
  }
  if (s.contains('mini')) {
    return Icons.airport_shuttle;
  }
  if (s.contains('truck')) {
    return Icons.local_shipping;
  }
  return Icons.local_shipping;
}
