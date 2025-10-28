import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/phone_auth_provider.dart';
import '../../utils/app_routes.dart';

class PhoneAuthScreen extends ConsumerWidget {
  const PhoneAuthScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phoneAuthState = ref.watch(phoneAuthenticationProvider);
    final phoneAuthNotifier = ref.read(phoneAuthenticationProvider.notifier);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 56),

              // Title
              Text(
                'Enter your phone number',
                style: Theme.of(
                  context,
                ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
              ),

              const SizedBox(height: 8),

              // Helper text
              Text(
                "We'll send an OTP to verify",
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),

              const SizedBox(height: 32),

              // Phone input field
              TextFormField(
                keyboardType: TextInputType.number,
                inputFormatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(10)],
                decoration: InputDecoration(
                  prefixIcon: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      border: Border(right: BorderSide(color: Theme.of(context).colorScheme.outline)),
                    ),
                    child: Text(
                      '+91',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface),
                    ),
                  ),
                  hintText: 'Enter phone number',
                  hintStyle: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.6)),
                  errorText: phoneAuthState.error,
                ),
                style: Theme.of(context).textTheme.bodyLarge,
                onChanged: (value) {
                  phoneAuthNotifier.updatePhoneNumber(value);
                  if (phoneAuthState.error != null) {
                    phoneAuthNotifier.setError(null);
                  }
                },
              ),

              const SizedBox(height: 24),

              // Continue button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: phoneAuthState.canSendOtp
                      ? () async {
                          await phoneAuthNotifier.sendOtp();
                          if (phoneAuthState.verificationId != null || phoneAuthState.autoVerifiedCredential != null) {
                            if (context.mounted) {
                              await context.pushNamed(AppRoutes.otp, extra: phoneAuthState.phoneNumber);
                            }
                          }
                        }
                      : null,
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                  child: phoneAuthState.isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(
                          'Continue',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                ),
              ),

              const Spacer(),

              // Terms and privacy
              Center(
                child: Text(
                  'By continuing, you agree to our Terms & Privacy Policy',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 16),

              // Google sign-in button (placeholder)
              SizedBox(
                width: double.infinity,
                height: 56,
                child: OutlinedButton(
                  onPressed: () {
                    // TODO: Implement Google sign-in
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Google sign-in coming soon!')));
                  },
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: Theme.of(context).colorScheme.outline),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Placeholder for Google icon
                      Container(
                        width: 20,
                        height: 20,
                        decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(2)),
                        child: const Center(
                          child: Text(
                            'G',
                            style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Sign in with Google',
                        style: Theme.of(
                          context,
                        ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
