import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'storage_provider.dart';

/// Persists driver KYC submission state for routing (mirrors server until token refresh).
const kDriverOnboardingStatusKey = 'onboarding_status';

/// Local marker: user submitted documents and awaits `isVerified` from the API.
const kDriverOnboardingPendingReview = 'pending_review';

final driverOnboardingStatusProvider = FutureProvider<String?>((Ref ref) async {
  final prefs = await ref.watch(sharedPreferencesProvider.future);
  return prefs.getString(kDriverOnboardingStatusKey);
});
