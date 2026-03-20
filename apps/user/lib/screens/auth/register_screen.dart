// lib/screens/auth/register_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_state_provider.dart';
import '../../utils/app_routes.dart';
import '../../utils/auth_utils.dart';
import '../../utils/font_utils.dart';
import '../../utils/logger.dart';
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

  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isGoogleSigningIn = false;

  // Validation state variables
  bool _isFullNameValid = true;
  bool _isEmailValid = true;
  bool _isPhoneValid = true;
  bool _isPasswordValid = true;

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

  // Helper method to get border color based on validation state
  Color _getBorderColor(bool isValid, bool isDark) {
    if (!isValid) {
      return const Color(0xFFEF4444); // Red for error
    }
    return isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0); // Default colors
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
            context.go(AppRoutes.home);
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
      final result = await authState.register(
        fullName: _fullNameController.text.trim(),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        phoneNumber: '+91${_phoneController.text.trim()}',
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

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24).copyWith(bottom: MediaQuery.of(context).viewInsets.bottom + 24),
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
                    decoration: BoxDecoration(color: const Color(0xFF6366F1).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)),
                    child: Center(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: SvgPicture.asset('assets/app_logo.svg', width: 64, height: 64),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Welcome Text
                Text(
                  'Create Account',
                  style: FontUtils.getPlusJakartaSans(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : const Color(0xFF0F172A),
                  ),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 8),

                Text(
                  'Sign up to get started with Shipzy.',
                  style: FontUtils.getPlusJakartaSans(fontSize: 15, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                  textAlign: TextAlign.center,
                ),

                const SizedBox(height: 32),

                // Full Name Field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getBorderColor(_isFullNameValid, isDark)),
                      ),
                      child: TextFormField(
                        controller: _fullNameController,
                        enabled: !_isLoading,
                        textInputAction: TextInputAction.next,
                        style: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          hintText: 'Enter full name',
                          hintStyle: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(16),
                          prefixIcon: Icon(Icons.person_outline, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _isFullNameValid = value.trim().isNotEmpty && value.trim().length >= 2;
                          });
                        },
                        validator: (value) {
                          setState(() {
                            _isFullNameValid = value != null && value.trim().isNotEmpty && value.trim().length >= 2;
                          });
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your full name';
                          }
                          if (value.trim().length < 2) {
                            return 'Name must be at least 2 characters';
                          }
                          return null;
                        },
                      ),
                    ),
                    if (!_isFullNameValid)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 12),
                        child: Text(
                          _fullNameController.text.trim().isEmpty ? 'Please enter your full name' : 'Name must be at least 2 characters',
                          style: FontUtils.getPlusJakartaSans(fontSize: 12, color: const Color(0xFFEF4444)),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Email Field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getBorderColor(_isEmailValid, isDark)),
                      ),
                      child: TextFormField(
                        controller: _emailController,
                        enabled: !_isLoading,
                        keyboardType: TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        style: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          hintText: 'Enter email address',
                          hintStyle: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(16),
                          prefixIcon: Icon(Icons.email_outlined, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _isEmailValid = AuthValidators.validateEmail(value) == null;
                          });
                        },
                        validator: (value) {
                          final error = AuthValidators.validateEmail(value);
                          setState(() {
                            _isEmailValid = error == null;
                          });
                          return error;
                        },
                      ),
                    ),
                    if (!_isEmailValid)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 12),
                        child: Text(
                          'Please enter a valid email address',
                          style: FontUtils.getPlusJakartaSans(fontSize: 12, color: const Color(0xFFEF4444)),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Phone Field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getBorderColor(_isPhoneValid, isDark)),
                      ),
                      child: TextFormField(
                        controller: _phoneController,
                        enabled: !_isLoading,
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                        style: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          hintText: 'Enter phone number',
                          hintStyle: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.all(16),
                          prefixIcon: Icon(Icons.phone_outlined, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _isPhoneValid = value.trim().isNotEmpty && RegExp(r'^[0-9]{10}$').hasMatch(value.trim());
                          });
                        },
                        validator: (value) {
                          setState(() {
                            _isPhoneValid = value != null && value.trim().isNotEmpty && RegExp(r'^[0-9]{10}$').hasMatch(value.trim());
                          });
                          if (value == null || value.trim().isEmpty) {
                            return 'Please enter your phone number';
                          }
                          if (!RegExp(r'^[0-9]{10}$').hasMatch(value.trim())) {
                            return 'Please enter a valid 10-digit phone number';
                          }
                          return null;
                        },
                      ),
                    ),
                    if (!_isPhoneValid)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 12),
                        child: Text(
                          _phoneController.text.trim().isEmpty ? 'Please enter your phone number' : 'Please enter a valid 10-digit phone number',
                          style: FontUtils.getPlusJakartaSans(fontSize: 12, color: const Color(0xFFEF4444)),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Password Field
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: _getBorderColor(_isPasswordValid, isDark)),
                      ),
                      child: TextFormField(
                        controller: _passwordController,
                        enabled: !_isLoading,
                        obscureText: _obscurePassword,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
                        style: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? Colors.white : const Color(0xFF0F172A)),
                        decoration: InputDecoration(
                          hintText: 'Enter password',
                          hintStyle: FontUtils.getPlusJakartaSans(fontSize: 16, color: isDark ? const Color(0xFF64748B) : const Color(0xFF94A3B8)),
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
                        onChanged: (value) {
                          setState(() {
                            _isPasswordValid = AuthValidators.validatePassword(value) == null;
                          });
                        },
                        validator: (value) {
                          final error = AuthValidators.validatePassword(value);
                          setState(() {
                            _isPasswordValid = error == null;
                          });
                          return error;
                        },
                      ),
                    ),
                    if (!_isPasswordValid)
                      Padding(
                        padding: const EdgeInsets.only(top: 4, left: 12),
                        child: Text(
                          'Password must be at least 8 characters long',
                          style: FontUtils.getPlusJakartaSans(fontSize: 12, color: const Color(0xFFEF4444)),
                        ),
                      ),
                  ],
                ),

                const SizedBox(height: 16),

                // Sign Up Button
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
                        : Text('Create Account', style: FontUtils.getPlusJakartaSans(fontSize: 16, fontWeight: FontWeight.w600)),
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
                        style: FontUtils.getPlusJakartaSans(
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
                                style: FontUtils.getPlusJakartaSans(
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

                // Sign In Link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'Already have an account?',
                      style: FontUtils.getPlusJakartaSans(fontSize: 14, color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                    ),
                    TextButton(
                      onPressed: _isLoading ? null : () => context.pop(),
                      style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 8), minimumSize: Size.zero),
                      child: Text(
                        'Sign In',
                        style: FontUtils.getPlusJakartaSans(fontSize: 14, fontWeight: FontWeight.w600, color: const Color(0xFF6366F1)),
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
