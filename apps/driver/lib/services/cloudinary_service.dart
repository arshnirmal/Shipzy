import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/dio_provider.dart';

part 'cloudinary_service.g.dart';

@riverpod
CloudinaryService cloudinaryService(Ref ref) => CloudinaryService(ref.read(dioProvider));

/// Cloudinary asset paths are rooted at [kShipzyRoot]; driver app uses [kDriverRoot] below that.
const String kShipzyRoot = 'shipzy';

/// All driver-app uploads live under `shipzy/driver/...` for media library hygiene and preset rules.
const String kDriverRoot = '$kShipzyRoot/driver';

class CloudinaryService {
  CloudinaryService(this._dio);

  final Dio _dio;

  /// Onboarding profile picture.
  Future<String> uploadDriverProfilePhoto(XFile imageFile) =>
      _uploadUnsigned(imageFile, folder: '$kDriverRoot/profile');

  /// KYC stills (license, registration, insurance). [documentKey] is a short slug, e.g. `license`.
  Future<String> uploadDriverKycDocument(XFile imageFile, {required String documentKey}) =>
      _uploadUnsigned(imageFile, folder: '$kDriverRoot/kyc/$documentKey');

  /// Optional photo attached to proof-of-delivery.
  Future<String> uploadProofOfDeliveryPhoto(XFile imageFile) =>
      _uploadUnsigned(imageFile, folder: '$kDriverRoot/delivery/proof');

  /// Optional photo when marking an order undeliverable.
  Future<String> uploadUndeliverableEvidencePhoto(XFile imageFile) =>
      _uploadUnsigned(imageFile, folder: '$kDriverRoot/delivery/undeliverable');

  Future<String> _uploadUnsigned(XFile imageFile, {required String folder}) async {
    final cloudName = dotenv.env['CLOUDINARY_CLOUD_NAME'];
    final uploadPreset = dotenv.env['CLOUDINARY_UPLOAD_PRESET'];

    if (cloudName == null || cloudName.isEmpty || uploadPreset == null || uploadPreset.isEmpty) {
      throw Exception('Cloudinary environment variables are not configured');
    }

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(imageFile.path),
      'upload_preset': uploadPreset,
      'folder': folder,
    });

    final response = await _dio.post<Map<String, dynamic>>(
      'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
      data: formData,
      options: Options(
        headers: {'Authorization': null},
        contentType: 'multipart/form-data',
      ),
    );

    final secureUrl = response.data?['secure_url'];
    if (secureUrl is! String || secureUrl.isEmpty) {
      throw Exception('Cloudinary upload response did not include secure_url');
    }
    return secureUrl;
  }
}
