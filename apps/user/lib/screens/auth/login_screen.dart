// lib/screens/auth/login_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../providers/auth_state_provider.dart';
import '../../utils/app_routes.dart';
import '../../utils/auth_utils.dart';
import '../../utils/logger.dart';
import '../../utils/snackbar_utils.dart';

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
      final authState = ref.read(authStateProvider.notifier);
      final result = await authState.signInWithGoogle();

      result.when(
        success: (user, {required bool isNewUser}) {
          if (mounted) {
            SnackbarUtils.showSuccess(context, 'Welcome back, ${user.fullName}');
            context.go(AppRoutes.home);
          }
        },
        error: (message) {
          AppLogger.e('Google sign in error: $message');
          if (mounted) {
            SnackbarUtils.showError(context, AuthErrorParser.parseLoginError(message), showDismiss: true);
          }
        },
      );
    } catch (e) {
      AppLogger.e('Google sign in error: $e');
      if (mounted) {
        SnackbarUtils.showError(context, 'Failed to sign in with Google');
      }
    } finally {
      setState(() => _isGoogleSigningIn = false);
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24).copyWith(bottom: MediaQuery.of(context).viewInsets.bottom + 24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 64),

                // Logo Header
                Center(
                  child: Container(
                    width: 64,
                    height: 64,
                    decoration: BoxDecoration(color: const Color(0xFF6366F1).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                    child: Center(child: SvgPicture.asset('assets/app_logo.svg', width: 32, height: 32)),
                  ),
                ),

                const SizedBox(height: 24),

                // Welcome Text
                Text(
                  'Welcome Back',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                Text(
                  'Log in to your Shipzy account to continue.',
                  style: GoogleFonts.plusJakartaSans(fontSize: 15, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 40),

                // Email Field
                Container(
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                  ),
                  child: TextFormField(
                    controller: _emailController,
                    enabled: !_isLoading,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    style: GoogleFonts.plusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      hintText: 'Enter email address',
                      hintStyle: GoogleFonts.plusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                      prefixIcon: Icon(Icons.email_outlined, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                    ),
                    validator: AuthValidators.validateEmail,
                  ),
                ),

                const SizedBox(height: 16),

                // Password Field
                Container(
                  decoration: BoxDecoration(
                    color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                  ),
                  child: TextFormField(
                    controller: _passwordController,
                    enabled: !_isLoading,
                    obscureText: _obscurePassword,
                    textInputAction: TextInputAction.done,
                    onFieldSubmitted: (_) => _submit(),
                    style: GoogleFonts.plusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                    decoration: InputDecoration(
                      hintText: 'Enter password',
                      hintStyle: GoogleFonts.plusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.all(16),
                      prefixIcon: Icon(Icons.lock_outline, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                      suffixIcon: IconButton(
                        onPressed: _togglePasswordVisibility,
                        icon: Icon(
                          _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                        ),
                      ),
                    ),
                    validator: AuthValidators.validatePassword,
                  ),
                ),

                const SizedBox(height: 16),

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
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w500, color: const Color(0xFF6366F1)),
                    ),
                  ),
                ),

                const SizedBox(height: 32),

                // Sign In Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6366F1),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.white)),
                          )
                        : Text('Sign In', style: GoogleFonts.plusJakartaSans(fontSize: 16, fontWeight: FontWeight.w600)),
                  ),
                ),

                const SizedBox(height: 24),

                // Divider
                Row(
                  children: [
                    Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0), thickness: 1)),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Text(
                        'OR',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8),
                        ),
                      ),
                    ),
                    Expanded(child: Divider(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0), thickness: 1)),
                  ],
                ),

                const SizedBox(height: 24),

                // Google Sign In Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: OutlinedButton(
                    onPressed: _isGoogleSigningIn ? null : _signInWithGoogle,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
                    ),
                    child: _isGoogleSigningIn
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6366F1))),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Google Icon
                              Container(
                                width: 20,
                                height: 20,
                                decoration: const BoxDecoration(color: Color(0xFF4285F4), shape: BoxShape.circle),
                                child: Center(
                                  child: Container(
                                    width: 16,
                                    height: 16,
                                    decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                                    child: Center(
                                      child: Container(
                                        width: 8,
                                        height: 8,
                                        decoration: const BoxDecoration(color: Color(0xFF4285F4), shape: BoxShape.circle),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'Continue with Google',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w500,
                                  color: isDark ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                  ),
                ),

                const SizedBox(height: 32),

                // Create Account Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Don't have an account?",
                      style: GoogleFonts.plusJakartaSans(fontSize: 14, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                    ),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.push(AppRoutes.register),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero),
                      child: Text(
                        'Create Account',
                        style: GoogleFonts.plusJakartaSans(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1)),
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
