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

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isGoogleSigningIn = false;

  @override
  void dispose() {
    _emailController.dispose();
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
          SnackbarUtils.showSuccess(context, 'Welcome back, ${user.fullName}');
          context.go(AppRoutes.splash);
        },
        error: (message) {
          AppLogger.e('Google sign in error: $message');
          if (mounted) {
            SnackbarUtils.showError(context, AuthErrorParser.parseLoginError(message));
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
      final result = await ref.read(authProvider.notifier).signInWithEmailAndPassword(_emailController.text.trim(), _passwordController.text);

      result.when(
        success: (user, {required bool isNewUser}) {
          if (!mounted) {
            return;
          }
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(context, 'Welcome back, ${user.fullName}');
          context.go(AppRoutes.splash);
        },
        error: (message) {
          AppLogger.e('Login error: $message');
          if (mounted) {
            SnackbarUtils.showError(context, AuthErrorParser.parseLoginError(message));
          }
        },
      );
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'An unexpected error occurred. Please try again.');
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
          padding: const EdgeInsets.symmetric(horizontal: 24).copyWith(bottom: 24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 56),
                Text(
                  'Welcome Back',
                  style: theme.textTheme.headlineMedium?.copyWith(color: theme.colorScheme.onSurface, fontWeight: FontWeight.w700),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text('Log in to your Shipzy account to continue.', style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
                const SizedBox(height: 32),
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
                const SizedBox(height: 16),
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
                const SizedBox(height: 8),
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Forgot password feature coming soon!'), behavior: SnackBarBehavior.floating),
                            );
                          },
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                    child: Text(
                      'Forgot password?',
                      style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                AuthLoadingButton(isLoading: _isLoading, onPressed: _submit, text: 'Log in'),
                const SizedBox(height: 20),
                const AuthDivider(text: 'or continue with'),
                const SizedBox(height: 20),
                SocialButton(
                  label: 'Continue with Google',
                  icon: SvgPicture.asset('assets/icons/Google.svg', width: 20, height: 20),
                  onPressed: _signInWithGoogle,
                  isLoading: _isGoogleSigningIn,
                ),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account?", style: theme.textTheme.bodyMedium),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.push(AppRoutes.register),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero),
                      child: Text(
                        'Create Account',
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
