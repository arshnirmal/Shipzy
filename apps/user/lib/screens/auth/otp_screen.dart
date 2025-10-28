import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';

import '../../providers/otp_provider.dart';

class OtpScreen extends ConsumerStatefulWidget {
  const OtpScreen({required this.phoneNumber, super.key});
  final String phoneNumber;

  @override
  ConsumerState<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends ConsumerState<OtpScreen> {
  final TextEditingController _otpController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Start the resend timer when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(otpVerificationProvider.notifier).startResendTimer();
    });
  }

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }

  String _formatPhoneNumber(String phone) {
    if (phone.length != 10) return phone;
    return '${phone.substring(0, 5)} ${phone.substring(5)}';
  }

  @override
  Widget build(BuildContext context) {
    final otpState = ref.watch(otpVerificationProvider);
    final otpNotifier = ref.read(otpVerificationProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.pop()),
        title: const Text('Verify Phone'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: Theme.of(context).colorScheme.onSurface,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 32),

              // Title
              Text(
                'Enter OTP',
                style: Theme.of(
                  context,
                ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
              ),

              const SizedBox(height: 8),

              // Subtext
              Text(
                'OTP sent to +91 ${_formatPhoneNumber(widget.phoneNumber)}',
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant),
              ),

              const SizedBox(height: 32),

              // OTP input fields
              PinCodeTextField(
                appContext: context,
                length: 6,
                controller: _otpController,
                animationType: AnimationType.fade,
                pinTheme: PinTheme(
                  shape: PinCodeFieldShape.box,
                  borderRadius: BorderRadius.circular(12),
                  fieldHeight: 56,
                  fieldWidth: 48,
                  activeFillColor: Theme.of(context).colorScheme.surface,
                  inactiveFillColor: Theme.of(context).colorScheme.surface,
                  selectedFillColor: Theme.of(context).colorScheme.surface,
                  activeColor: Theme.of(context).colorScheme.primary,
                  inactiveColor: Theme.of(context).colorScheme.outline,
                  selectedColor: Theme.of(context).colorScheme.primary,
                  borderWidth: 2,
                ),
                cursorColor: Theme.of(context).colorScheme.primary,
                animationDuration: const Duration(milliseconds: 300),
                enableActiveFill: true,
                keyboardType: TextInputType.number,
                textStyle: Theme.of(
                  context,
                ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
                onChanged: (value) {
                  otpNotifier.updateOtp(value);
                  if (otpState.error != null) {
                    otpNotifier.setError(null);
                  }
                },
                onCompleted: (value) {
                  // Auto-submit when all digits are entered
                  if (otpState.canVerify) {
                    otpNotifier.verifyOtp();
                  }
                },
              ),

              if (otpState.error != null) ...[
                const SizedBox(height: 16),
                Text(
                  otpState.error!,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.error),
                  textAlign: TextAlign.center,
                ),
              ],

              const SizedBox(height: 24),

              // Verify button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: otpState.canVerify ? otpNotifier.verifyOtp : null,
                  style: ElevatedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
                  child: otpState.isLoading
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : Text(
                          'Verify',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600, color: Colors.white),
                        ),
                ),
              ),

              const SizedBox(height: 16),

              // Resend and Change number row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Resend OTP
                  Expanded(
                    child: TextButton(
                      onPressed: otpState.canResend ? otpNotifier.resendOtp : null,
                      style: TextButton.styleFrom(padding: EdgeInsets.zero, alignment: Alignment.centerLeft),
                      child: Text(
                        otpState.resendCountdown > 0
                            ? "Didn't receive code? Resend in 0:${otpState.resendCountdown.toString().padLeft(2, '0')}"
                            : "Didn't receive code? Resend",
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: otpState.canResend ? Theme.of(context).colorScheme.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                          fontWeight: otpState.canResend ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                    ),
                  ),

                  // Change number
                  TextButton(
                    onPressed: () => context.pop(),
                    child: Text(
                      'Change number',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),

              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}
