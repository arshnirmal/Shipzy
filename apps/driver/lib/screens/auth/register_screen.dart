import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
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

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final result = await ref
          .read(authProvider.notifier)
          .createUserWithEmailAndPassword(
            _emailController.text.trim(),
            _passwordController.text.trim(),
            fullName: _fullNameController.text.trim(),
            phoneNumber: '+91${_phoneController.text.trim()}',
          );

      if (mounted) {
        result.when(
          success: (user, {required isNewUser}) {
            // Navigation handled by router listener
          },
          error: (message) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Registration failed: $message')));
          },
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleSignUp() async {
    setState(() => _isLoading = true);
    try {
      final result = await ref.read(authProvider.notifier).signInWithGoogle();

      if (mounted) {
        result.when(
          success: (user, {required isNewUser}) {
            // Navigation handled by router listener
          },
          error: (message) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Google sign-up failed: $message')));
          },
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
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
                    'Create Account',
                    style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
                  ),
                ),

                const SizedBox(height: 32),

                // Full Name Field
                AuthTextField(
                  controller: _fullNameController,
                  label: 'Full Name',
                  hintText: 'Enter full name',
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  prefixIcon: const Icon(Icons.person_outline),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your full name';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Email Field
                AuthTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hintText: 'Enter email address',
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  prefixIcon: const Icon(Icons.email_outlined),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Phone Number Field
                AuthTextField(
                  controller: _phoneController,
                  label: 'Phone Number',
                  hintText: '9876543210',
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  prefixIcon: const Icon(Icons.phone_outlined),
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your phone number';
                    }
                    if (value.length != 10) {
                      return 'Please enter a valid 10-digit phone number';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Password Field
                AuthTextField(
                  controller: _passwordController,
                  label: 'Password',
                  hintText: 'Enter password',
                  obscureText: _obscurePassword,
                  textInputAction: TextInputAction.next,
                  enabled: !_isLoading,
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    if (value.length < 6) {
                      return 'Password must be at least 6 characters';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 24),

                // Confirm Password Field
                AuthTextField(
                  controller: _confirmPasswordController,
                  label: 'Confirm Password',
                  hintText: 'Re-enter password',
                  obscureText: _obscureConfirmPassword,
                  textInputAction: TextInputAction.done,
                  enabled: !_isLoading,
                  onFieldSubmitted: (_) => _register(),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                    icon: Icon(_obscureConfirmPassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  ),
                  validator: (value) {
                    if (value != _passwordController.text) {
                      return 'Passwords do not match';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 32),

                // Register Button
                AuthLoadingButton(isLoading: _isLoading, onPressed: _register, text: 'Create Account'),

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
                const AuthDivider(text: 'Or Sign up with'),

                const SizedBox(height: 24),

                // Social Sign Up Buttons
                Row(
                  children: [
                    Expanded(
                      child: SocialButton(
                        label: 'Google',
                        icon: SvgPicture.asset('assets/icons/Google.svg', width: 20, height: 20),
                        onPressed: _isLoading ? null : _handleGoogleSignUp,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SocialButton(
                        label: 'Apple',
                        icon: SvgPicture.asset('assets/icons/Apple.svg', width: 22, height: 22),
                        onPressed: null, // TODO: Implement Apple sign-up
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
