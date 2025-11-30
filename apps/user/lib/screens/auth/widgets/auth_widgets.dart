// lib/utils/auth_widgets.dart

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// A divider widget used in authentication screens with text in the middle
class AuthDivider extends StatelessWidget {
  const AuthDivider({required this.text, super.key});

  final String text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dividerColor = theme.colorScheme.outline.withValues(alpha: 0.2);

    return Row(
      children: [
        Expanded(child: Divider(color: dividerColor, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            text,
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, fontWeight: FontWeight.w500),
          ),
        ),
        Expanded(child: Divider(color: dividerColor, thickness: 1)),
      ],
    );
  }
}

/// A social login button widget used in authentication screens
class SocialButton extends StatelessWidget {
  const SocialButton({required this.label, required this.icon, required this.onPressed, super.key});

  final String label;
  final Widget icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return OutlinedButton.icon(
      onPressed: onPressed,
      icon: icon,
      label: Text(
        label,
        style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurface),
      ),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        side: BorderSide(color: theme.colorScheme.outline.withValues(alpha: 0.3)),
        backgroundColor: theme.colorScheme.surface,
      ),
    );
  }
}

/// A reusable loading button widget for authentication screens
class AuthLoadingButton extends StatelessWidget {
  const AuthLoadingButton({required this.isLoading, required this.onPressed, required this.text, super.key});

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
            ? const SizedBox(
                height: 24,
                width: 24,
                child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
              )
            : Text(
                text,
                style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: Colors.white),
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          textInputAction: textInputAction,
          obscureText: obscureText,
          enabled: enabled,
          onFieldSubmitted: onFieldSubmitted,
          inputFormatters: inputFormatters,
          autovalidateMode: autovalidateMode,
          style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurface),
          decoration: InputDecoration(
            hintText: hintText,
            hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
            prefixIcon: prefixIcon,
            suffixIcon: suffixIcon,
          ),
          validator: validator,
        ),
      ],
    );
  }
}
