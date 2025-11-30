import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
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

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    FocusScope.of(context).unfocus();
    setState(() => _isLoading = true);

    try {
      final result = await ref.read(authProvider.notifier).signInWithEmailAndPassword(_emailController.text.trim(), _passwordController.text.trim());

      if (mounted) {
        result.when(
          success: (user, {required isNewUser}) {
            // Navigation is handled by the router listener
          },
          error: (message) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Login failed: $message')));
          },
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _googleLogin() async {
    setState(() => _isLoading = true);
    try {
      final result = await ref.read(authProvider.notifier).signInWithGoogle();

      if (mounted) {
        result.when(
          success: (user, {required isNewUser}) {
            // Navigation is handled by the router listener
          },
          error: (message) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Google Login failed: $message')));
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
                    'Sign In',
                    style: theme.textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: theme.colorScheme.onSurface),
                  ),
                ),

                const SizedBox(height: 32),

                // Email Address Field
                AuthTextField(
                  controller: _emailController,
                  label: 'Email Address',
                  hintText: 'Enter email address',
                  keyboardType: TextInputType.emailAddress,
                  enabled: !_isLoading,
                  // autofocus: true, // Let's try autofocus
                  prefixIcon: const Icon(Icons.email_outlined),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
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
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _login(),
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: _togglePasswordVisibility,
                    icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your password';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 8),

                // Forgot Password
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
                      style: theme.textTheme.labelLarge?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w500),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Sign In Button
                AuthLoadingButton(isLoading: _isLoading, onPressed: _login, text: 'Sign In'),

                const SizedBox(height: 16),

                // Create Account Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account?", style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.push('/register'),
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
                        onPressed: _isLoading ? null : _googleLogin,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: SocialButton(
                        label: 'Apple',
                        icon: SvgPicture.asset('assets/icons/Apple.svg', width: 22, height: 22),
                        onPressed: null, // TODO: Implement Apple sign-in
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
