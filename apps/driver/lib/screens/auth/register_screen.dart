import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../../utils/app_routes.dart';
import '../../utils/auth_utils.dart';
import '../../utils/logger.dart';
import '../../utils/snackbar_utils.dart';
import 'widgets/auth_widgets.dart';

const double _kHorizontalPadding = 24;
const double _kTopSpacing = 56;
const double _kSectionSpacing = 32;
const double _kFieldSpacing = 16;
const double _kBlockSpacing = 24;
const double _kDividerSpacing = 20;

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
      final result = await ref.read(authProvider.notifier).signInWithGoogle();

      result.when(
        success: (user, {required bool isNewUser}) {
          if (!mounted) {
            return;
          }
          SnackbarUtils.showSuccess(
            context,
            'Welcome to Shipzy, ${user.fullName}',
          );
          context.go(AppRoutes.splash);
        },
        error: (message) {
          AppLogger.e('Google sign in error: $message');
          if (mounted) {
            SnackbarUtils.showError(
              context,
              AuthErrorParser.parseRegisterError(message),
            );
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

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final result = await ref
          .read(authProvider.notifier)
          .createUserWithEmailAndPassword(
            _emailController.text.trim(),
            _passwordController.text,
            fullName: _fullNameController.text.trim(),
            phoneNumber: '+91${_phoneController.text.trim()}',
          );

      result.when(
        success: (user, {required bool isNewUser}) {
          if (!mounted) {
            return;
          }
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(
            context,
            'Welcome to Shipzy, ${user.fullName}!',
          );
          context.go(AppRoutes.splash);
        },
        error: (message) {
          AppLogger.e('Register error: $message');
          if (mounted) {
            SnackbarUtils.showError(
              context,
              AuthErrorParser.parseRegisterError(message),
            );
          }
        },
      );
    } catch (e) {
      AppLogger.e('Register error: $e');
      if (mounted) {
        SnackbarUtils.showError(
          context,
          'An unexpected error occurred. Please try again.',
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: _kHorizontalPadding,
          ).copyWith(bottom: _kBlockSpacing),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: _kTopSpacing),
                Text(
                  'Create Account',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    color: theme.colorScheme.onSurface,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Create your Shipzy account to start delivering.',
                  style: theme.textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: _kSectionSpacing),
                AuthTextField(
                  controller: _fullNameController,
                  label: 'Full Name',
                  hintText: 'Enter full name',
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.person_outline),
                  enabled: !_isLoading,
                  validator: AuthValidators.validateFullName,
                ),
                const SizedBox(height: _kFieldSpacing),
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
                const SizedBox(height: _kFieldSpacing),
                AuthTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hintText: 'Enter phone number',
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  prefixIcon: const Icon(Icons.phone_outlined),
                  enabled: !_isLoading,
                  validator: AuthValidators.validatePhoneNumber,
                ),
                const SizedBox(height: _kFieldSpacing),
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
                    icon: Icon(
                      _obscurePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                  enabled: !_isLoading,
                  validator: (value) =>
                      AuthValidators.validatePassword(value, minLength: 8),
                ),
                const SizedBox(height: _kBlockSpacing),
                AuthLoadingButton(
                  isLoading: _isLoading,
                  onPressed: _submit,
                  text: 'Create account',
                ),
                const SizedBox(height: _kDividerSpacing),
                const AuthDivider(text: 'or continue with'),
                const SizedBox(height: _kDividerSpacing),
                SocialButton(
                  label: 'Continue with Google',
                  icon: SvgPicture.asset(
                    'assets/icons/Google.svg',
                    width: 20,
                    height: 20,
                  ),
                  onPressed: _signInWithGoogle,
                  isLoading: _isGoogleSigningIn,
                ),
                const SizedBox(height: _kBlockSpacing),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account?',
                      style: theme.textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.pop(),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                      ),
                      child: Text(
                        'Sign in',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
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
