import 'package:image_picker/image_picker.dart';

/// Client-side resize + JPEG quality before Cloudinary upload.
///
/// Uses [ImagePicker] platform decoding where supported (iOS/Android pick
/// pipeline scales before returning an [XFile]). Keeps policy in one place.
///
/// Rationale (typical mobile / ops tradeoffs):
/// - **Profile:** Small UI avatars; cap ~800px to limit bytes without visible loss.
/// - **KYC:** Reviewers/OCR need legible text; ~2K max edge is a common cap before diminishing returns.
/// - **Delivery evidence:** Context photos; ~1.6K edge balances detail vs uplink on cellular.
enum DriverImageUploadUse { profile, kyc, deliveryEvidence }

Future<XFile?> pickImageForDriverUpload(
  ImagePicker picker, {
  required ImageSource source,
  required DriverImageUploadUse use,
}) {
  final (maxEdge, quality) = switch (use) {
    // Avatar display is small; aggressive cap saves bandwidth.
    DriverImageUploadUse.profile => (800.0, 82),
    // IDs/registrations: preserve readable type; avoid multi‑MB originals.
    DriverImageUploadUse.kyc => (2048.0, 82),
    // POD / undeliverable: enough for scene detail; lighter than full camera resolution.
    DriverImageUploadUse.deliveryEvidence => (1600.0, 78),
  };

  return picker.pickImage(
    source: source,
    maxWidth: maxEdge,
    maxHeight: maxEdge,
    imageQuality: quality,
  );
}
