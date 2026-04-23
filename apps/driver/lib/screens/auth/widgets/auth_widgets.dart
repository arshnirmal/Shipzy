// lib/screens/auth/widgets/auth_widgets.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../theme/design_tokens.dart';

/// Label density for [AuthTextField] — matches login/register vs onboarding sections.
enum AuthFieldLabelDensity {
  /// `bodyMedium`, on-surface (login / register).
  standard,

  /// `labelSmall`, on-surface-variant, letter-spacing (vehicle onboarding).
  section,
}

/// A divider widget used in authentication screens with text in the middle
class AuthDivider extends StatelessWidget {
  const AuthDivider({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outlineVariant.withValues(
      alpha: AppDepth.ghostBorderOpacity,
    );

    return Row(
      children: [
        Expanded(child: Divider(color: dividerColor, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
          child: Text(
            text,
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Expanded(child: Divider(color: dividerColor, thickness: 1)),
      ],
    );
  }
}

/// A social login button widget used in authentication screens
class SocialButton extends StatelessWidget {
  const SocialButton({
    required this.label,
    required this.icon,
    required this.onPressed,
    this.isLoading = false,
    super.key,
  });

  final String label;
  final Widget icon;
  final VoidCallback? onPressed;
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: OutlinedButton.icon(
        onPressed: isLoading ? null : onPressed,
        icon: isLoading
            ? SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    theme.colorScheme.primary,
                  ),
                ),
              )
            : icon,
        label: Text(
          label,
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w700,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: 14,
          ),
          shape: RoundedRectangleBorder(borderRadius: AppRadius.radiusLg),
          side: BorderSide(
            color: theme.colorScheme.outlineVariant.withValues(
              alpha: AppDepth.ghostBorderOpacity,
            ),
          ),
          backgroundColor: theme.colorScheme.surfaceContainerLowest,
        ),
      ),
    );
  }
}

/// A reusable loading button widget for authentication screens
class AuthLoadingButton extends StatelessWidget {
  const AuthLoadingButton({
    required this.isLoading,
    required this.onPressed,
    required this.text,
    super.key,
  });

  final bool isLoading;
  final VoidCallback? onPressed;
  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        child: isLoading
            ? SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    theme.colorScheme.onPrimary,
                  ),
                ),
              )
            : Text(
                text,
                style: theme.textTheme.bodyLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onPrimary,
                ),
              ),
      ),
    );
  }
}

/// A reusable form field widget with consistent styling
class AuthTextField extends StatelessWidget {
  const AuthTextField({
    required this.controller,
    required this.label,
    required this.hintText,
    super.key,
    this.keyboardType,
    this.textInputAction,
    this.obscureText = false,
    this.enabled = true,
    this.prefixIcon,
    this.suffixIcon,
    this.validator,
    this.onFieldSubmitted,
    this.inputFormatters,
    this.autovalidateMode,
    this.textCapitalization = TextCapitalization.none,
    this.labelDensity = AuthFieldLabelDensity.standard,
    this.labelGap,
  });

  final TextEditingController controller;
  final String label;
  final String hintText;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final bool obscureText;
  final bool enabled;
  final Widget? prefixIcon;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;
  final void Function(String)? onFieldSubmitted;
  final List<TextInputFormatter>? inputFormatters;
  final AutovalidateMode? autovalidateMode;
  final TextCapitalization textCapitalization;
  final AuthFieldLabelDensity labelDensity;

  /// Space between label and field; defaults from [labelDensity].
  final double? labelGap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final gap =
        labelGap ??
        (labelDensity == AuthFieldLabelDensity.section ? 6.0 : AppSpacing.xs);

    final labelStyle = switch (labelDensity) {
      AuthFieldLabelDensity.standard => theme.textTheme.bodyMedium?.copyWith(
        fontWeight: FontWeight.w700,
        color: theme.colorScheme.onSurface,
      ),
      AuthFieldLabelDensity.section => theme.textTheme.labelSmall?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        letterSpacing: 0.8,
      ),
    };

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: labelStyle),
        SizedBox(height: gap),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          obscureText: obscureText,
          enabled: enabled,
          textCapitalization: textCapitalization,
          onFieldSubmitted: onFieldSubmitted,
          inputFormatters: inputFormatters,
          autovalidateMode: autovalidateMode,
          style: theme.textTheme.bodyLarge?.copyWith(
            color: theme.colorScheme.onSurface,
          ),
          decoration: InputDecoration(
            hintText: hintText,
            prefixIcon: prefixIcon == null
                ? null
                : IconTheme.merge(
                    data: IconThemeData(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    child: prefixIcon!,
                  ),
            suffixIcon: suffixIcon == null
                ? null
                : IconTheme.merge(
                    data: IconThemeData(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    child: suffixIcon!,
                  ),
          ),
          validator: validator,
        ),
      ],
    );
  }
}
