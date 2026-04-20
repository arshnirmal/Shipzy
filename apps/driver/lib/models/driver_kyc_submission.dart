import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver_kyc_submission.freezed.dart';
part 'driver_kyc_submission.g.dart';

/// `onboarding` object returned by `POST /api/v1/drivers/me/kyc`.
@freezed
class ProfileOnboardingState with _$ProfileOnboardingState {
  const factory ProfileOnboardingState({
    required String status,
    required List<String> stepsCompleted,
    String? submittedAt,
    String? approvedAt,
    String? rejectedReason,
  }) = _ProfileOnboardingState;

  factory ProfileOnboardingState.fromJson(Map<String, dynamic> json) =>
      _$ProfileOnboardingStateFromJson(json);
}

/// `data` envelope from `POST /api/v1/drivers/me/kyc`.
@freezed
class DriverKycSubmissionResult with _$DriverKycSubmissionResult {
  const factory DriverKycSubmissionResult({
    required ProfileOnboardingState onboarding,
  }) = _DriverKycSubmissionResult;

  factory DriverKycSubmissionResult.fromJson(Map<String, dynamic> json) =>
      _$DriverKycSubmissionResultFromJson(json);
}
