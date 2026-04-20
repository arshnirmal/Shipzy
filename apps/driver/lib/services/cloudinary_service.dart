import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../providers/dio_provider.dart';

part 'cloudinary_service.g.dart';

@riverpod
CloudinaryService cloudinaryService(Ref ref) => CloudinaryService(ref.read(dioProvider));

class CloudinaryService {
  CloudinaryService(this._dio);

  final Dio _dio;

  Future<String> uploadDeliveryPhoto(XFile imageFile) async {
    final cloudName = dotenv.env['CLOUDINARY_CLOUD_NAME'];
    final uploadPreset = dotenv.env['CLOUDINARY_UPLOAD_PRESET'];

    if (cloudName == null || cloudName.isEmpty || uploadPreset == null || uploadPreset.isEmpty) {
      throw Exception('Cloudinary environment variables are not configured');
    }

    final formData = FormData.fromMap({'file': await MultipartFile.fromFile(imageFile.path), 'upload_preset': uploadPreset});

    final response = await _dio.post<Map<String, dynamic>>(
      'https://api.cloudinary.com/v1_1/$cloudName/image/upload',
      data: formData,
      options: Options(
        headers: {
          // Cloudinary unsigned upload does not require app auth headers.
          'Authorization': null,
        },
        contentType: 'multipart/form-data',
      ),
    );

    final secureUrl = response.data?['secure_url'];
    if (secureUrl is! String || secureUrl.isEmpty) {
      throw Exception('Cloudinary upload response did not include secure_url');
    }

    return secureUrl;
  }

  /// Unsigned image upload (profile, KYC). [folder] is appended under `shipzy/`.
  Future<String> uploadDocument(XFile imageFile, {String folder = 'kyc'}) async {
    final cloudName = dotenv.env['CLOUDINARY_CLOUD_NAME'];
    final uploadPreset = dotenv.env['CLOUDINARY_UPLOAD_PRESET'];

    if (cloudName == null || cloudName.isEmpty || uploadPreset == null || uploadPreset.isEmpty) {
      throw Exception('Cloudinary environment variables are not configured');
    }

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(imageFile.path),
      'upload_preset': uploadPreset,
      'folder': 'shipzy/$folder',
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
