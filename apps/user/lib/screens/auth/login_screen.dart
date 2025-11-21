// lib/screens/auth/login_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_state_provider.dart';
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

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _togglePasswordVisibility() {
    setState(() => _obscurePassword = !_obscurePassword);
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
      final result = await authState.login(email: _emailController.text.trim(), password: _passwordController.text);

      result.when(
        success: (user, {required bool isNewUser}) {
          // Dismiss keyboard and show success message
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(context, 'Welcome back, ${user.fullName}');

          // Navigate to home
          context.go(AppRoutes.home);
        },
        error: (message) {
          AppLogger.e('Login error: $message');
          SnackbarUtils.showError(context, AuthErrorParser.parseLoginError(message), showDismiss: true);
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

  Future<void> _handleGoogleSignIn() async {
    setState(() => _isLoading = true);

    try {
      final authState = ref.read(authStateProvider.notifier);
      final result = await authState.signInWithGoogle();

      result.when(
        success: (user, {required bool isNewUser}) {
          final message = isNewUser ? 'Welcome to Shipzy, ${user.fullName}!' : 'Welcome back, ${user.fullName}!';

          // Dismiss keyboard and show success message
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(context, message);
          context.go(AppRoutes.home);
        },
        error: (message) {
          SnackbarUtils.showError(context, AuthErrorParser.parseLoginError(message));
        },
      );
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Google sign-in failed. Please try again.');
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
      backgroundColor: theme.colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24).copyWith(bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),

                // Title
                Center(
                  child: Text(
                    'Sign In',
                    style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
                  ),
                ),

                const SizedBox(height: 32),

                // Email Field
                Text(
                  'Email Address',
                  style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  decoration: InputDecoration(
                    hintText: 'Enter email address',
                    hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
                    prefixIcon: const Icon(Icons.email_outlined),
                  ),
                  validator: AuthValidators.validateEmail,
                ),

                const SizedBox(height: 24),

                // Password Field
                Text(
                  'Password',
                  style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.done,
                  enabled: !_isLoading,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    hintText: 'Enter password',
                    hintStyle: TextStyle(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.6)),
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      onPressed: _togglePasswordVisibility,
                      icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    ),
                  ),
                  validator: AuthValidators.validatePassword,
                ),

                const SizedBox(height: 8),

                // Forgot Password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: _isLoading
                        ? null
                        : () {
                            // TODO(dev): Navigate to forgot password flow
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Forgot password feature coming soon!'), behavior: SnackBarBehavior.floating),
                            );
                          },
                    style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: Size.zero, tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                    child: Text(
                      'Forgot password?',
                      style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w500),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Sign In Button
                AuthLoadingButton(isLoading: _isLoading, onPressed: _submit, text: 'Sign In'),

                const SizedBox(height: 16),

                // Create Account Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account?", style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.push(AppRoutes.register),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero),
                      child: Text(
                        'Create Account',
                        style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Divider
                const AuthDivider(text: 'Or Sign in with'),

                const SizedBox(height: 24),

                // Social Login Buttons
                Row(
                  children: [
                    Expanded(
                      child: SocialButton(
                        label: 'Google',
                        icon: SvgPicture.asset('assets/icons/Google.svg', width: 20, height: 20),
                        onPressed: _isLoading ? null : _handleGoogleSignIn,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SocialButton(
                        label: 'Apple',
                        icon: SvgPicture.asset('assets/icons/Apple.svg', width: 22, height: 22),
                        onPressed: null, // TODO(dev): Implement Apple sign-in
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
