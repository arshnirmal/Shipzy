// lib/screens/auth/register_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_state_provider.dart';
import '../../utils/app_routes.dart';
import '../../utils/snackbar_utils.dart';

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
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
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
        phoneNumber: _phoneController.text.trim(),
      );

      result.when(
        success: (user, {required bool isNewUser}) {
          // Dismiss keyboard and show success message
          FocusScope.of(context).unfocus();
          SnackbarUtils.showSuccess(context, 'Welcome to Shipzy, ${user.fullName}!');

          // Navigate to home
          context.go(AppRoutes.home);
        },
        error: (message) {
          SnackbarUtils.showError(context, _getErrorMessage(message), showDismiss: true);
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

  Future<void> _handleGoogleSignUp() async {
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
          SnackbarUtils.showError(context, _getErrorMessage(message));
        },
      );
    } catch (e) {
      if (mounted) {
        SnackbarUtils.showError(context, 'Google sign-up failed. Please try again.');
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _getErrorMessage(String error) {
    if (error.contains('Email already exists') || error.contains('already registered')) {
      return 'An account with this email already exists.';
    } else if (error.contains('Phone number already exists')) {
      return 'This phone number is already registered.';
    } else if (error.contains('Network error') || error.contains('Connection timeout')) {
      return 'Network error. Please check your connection.';
    } else if (error.contains('Server not responding')) {
      return 'Server is not responding. Please try again later.';
    }
    return error;
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
                    'Create Account',
                    style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
                  ),
                ),

                const SizedBox(height: 32),

                // Full Name Field
                Text(
                  'Full Name',
                  style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _fullNameController,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  textCapitalization: TextCapitalization.words,
                  decoration: const InputDecoration(hintText: 'Enter full name', prefixIcon: Icon(Icons.person_outline)),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your full name';
                    }
                    if (value.trim().length < 2) {
                      return 'Name must be at least 2 characters';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

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
                  decoration: const InputDecoration(hintText: 'Enter email address', prefixIcon: Icon(Icons.email_outlined)),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your email';
                    }
                    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
                    if (!emailRegex.hasMatch(value.trim())) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Phone Number Field
                Text(
                  'Phone Number',
                  style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  decoration: const InputDecoration(
                    hintText: '+919876543210',
                    prefixIcon: Icon(Icons.phone_outlined),
                    helperText: 'Include country code (e.g., +91 for India)',
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter your phone number';
                    }
                    final phoneRegex = RegExp(r'^\+[1-9]\d{1,14}$');
                    if (!phoneRegex.hasMatch(value.trim())) {
                      return 'Enter valid phone with country code';
                    }
                    return null;
                  },
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
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  decoration: InputDecoration(
                    hintText: 'Enter password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    helperText: 'Minimum 8 characters',
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Confirm Password Field
                Text(
                  'Confirm Password',
                  style: theme.textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w500, color: theme.colorScheme.onSurfaceVariant),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  enabled: !_isLoading,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    hintText: 'Re-enter password',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                      icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please confirm your password';
                    }
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 32),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)),
                          )
                        : Text(
                            'Create Account',
                            style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: Colors.white),
                          ),
                  ),
                ),

                const SizedBox(height: 16),

                // Sign In Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account?', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.pop(),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero),
                      child: Text(
                        'Sign In',
                        style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 24),

                // Divider
                const _AuthDivider(text: 'Or Sign up with'),

                const SizedBox(height: 24),

                // Social Sign Up Buttons
                Row(
                  children: [
                    Expanded(
                      child: _SocialButton(
                        label: 'Google',
                        icon: SvgPicture.asset('assets/icons/Google.svg', width: 20, height: 20),
                        onPressed: _isLoading ? null : _handleGoogleSignUp,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _SocialButton(
                        label: 'Apple',
                        icon: SvgPicture.asset('assets/icons/Apple.svg', width: 22, height: 22),
                        onPressed: null, // TODO(dev): Implement Apple sign-up
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

// Divider Widget
class _AuthDivider extends StatelessWidget {
  const _AuthDivider({required this.text});

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

// Social Button Widget
class _SocialButton extends StatelessWidget {
  const _SocialButton({required this.label, required this.icon, required this.onPressed});

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
