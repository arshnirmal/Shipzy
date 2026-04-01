// lib/screens/auth/register_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_state_provider.dart';
import '../../theme/design_tokens.dart';
import '../../utils/app_routes.dart';
import '../../utils/auth_utils.dart';
import '../../utils/logger.dart';
import '../../utils/snackbar_utils.dart';
import 'widgets/auth_widgets.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isGoogleSigningIn = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _togglePasswordVisibility() {
    setState(() => _obscurePassword = !_obscurePassword);
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isGoogleSigningIn = true);

    try {
      final authState = ref.read(authStateProvider.notifier);
      final result = await authState.signInWithGoogle();

      result.when(
        success: (user, {required bool isNewUser}) {
          if (mounted) {
            SnackbarUtils.showSuccess(context, 'Welcome to Shipzy, ${user.fullName}');
            context.go(AppRoutes.splash);
          }
        },
        error: (message) {
          AppLogger.e('Google sign in error: $message');
          if (mounted) {
            SnackbarUtils.showError(context, AuthErrorParser.parseRegisterError(message), showDismiss: true);
          }
        },
      );
    } catch (e) {
      AppLogger.e('Google sign in error: $e');
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to sign in with Google');
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleSigningIn = false);
      }
    }
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) {
      return;
    }

    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    setState(() => _isLoading = true);

    try {
      final authState = ref.read(authStateProvider.notifier);
      final result = await authState.register(
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        phoneNumber: '+91${_phoneController.text.trim()}',
      );

      result.when(
        success: (user, {required bool isNewUser}) {
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(context, 'Welcome to Shipzy, ${user.fullName}!');
          context.go(AppRoutes.splash);
        },
        error: (message) {
          AppLogger.e('Register error: $message');
          SnackbarUtils.showError(context, AuthErrorParser.parseRegisterError(message), showDismiss: true);
        },
      );
    } catch (e) {
      AppLogger.e('Register error: $e');
      if (mounted) {
        SnackbarUtils.showError(context, 'An unexpected error occurred. Please try again.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String? _validateFullName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your full name';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  String? _validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your phone number';
    }
    if (!RegExp(r'^[0-9]{10}$').hasMatch(value.trim())) {
      return 'Please enter a valid 10-digit phone number';
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg).copyWith(bottom: AppSpacing.lg),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 32),

                // Logo Header
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), borderRadius: AppRadius.radiusLg),
                    child: ClipRRect(
                      borderRadius: AppRadius.radiusLg,
                      child: Image.asset('assets/app_logo.png', fit: BoxFit.cover),
                    ),
                  ),
                ),

                const SizedBox(height: AppSpacing.lg),

                // Welcome Text
                Text(
                  'Create Account',
                  style: theme.textTheme.headlineMedium?.copyWith(color: theme.colorScheme.onSurface, fontWeight: FontWeight.w700),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: AppSpacing.xs),

                Text('Sign up to get started with Shipzy.', style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),

                const SizedBox(height: AppSpacing.xl),

                // Full Name Field
                AuthTextField(
                  controller: _fullNameController,
                  label: 'Full Name',
                  hintText: 'Enter full name',
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.person_outline),
                  enabled: !_isLoading,
                  validator: _validateFullName,
                ),

                const SizedBox(height: AppSpacing.md),

                // Email Field
                AuthTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hintText: 'Enter email address',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.email_outlined),
                  enabled: !_isLoading,
                  validator: AuthValidators.validateEmail,
                ),

                const SizedBox(height: AppSpacing.md),

                // Phone Field
                AuthTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hintText: 'Enter phone number',
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.phone_outlined),
                  enabled: !_isLoading,
                  validator: _validatePhone,
                ),

                const SizedBox(height: AppSpacing.md),

                // Password Field
                AuthTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hintText: 'Enter password',
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: _togglePasswordVisibility,
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  ),
                  enabled: !_isLoading,
                  validator: (value) => AuthValidators.validatePassword(value, minLength: 8),
                ),

                const SizedBox(height: AppSpacing.xl),

                // Sign Up Button
                AuthLoadingButton(isLoading: _isLoading, onPressed: _submit, text: 'Sign up'),

                const SizedBox(height: AppSpacing.lg),

                const AuthDivider(text: 'or continue with'),

                const SizedBox(height: AppSpacing.lg),

                // Google Sign In Button
                SocialButton(
                  label: 'Continue with Google',
                  icon: SvgPicture.asset('assets/icons/Google.svg', width: 20, height: 20),
                  onPressed: _signInWithGoogle,
                  isLoading: _isGoogleSigningIn,
                ),

                const SizedBox(height: AppSpacing.xl),

                // Sign In Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account?', style: theme.textTheme.bodyMedium),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                        minimumSize: Size.zero,
                      ),
                      child: Text(
                        'Log in',
                        style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
