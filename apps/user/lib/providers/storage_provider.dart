import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ignore: depend_on_referenced_packages
import '../objectbox.g.dart';

part 'storage_provider.g.dart';

// ============ SECURE STORAGE ============
@Riverpod(keepAlive: true)
FlutterSecureStorage secureStorage(Ref ref) => const FlutterSecureStorage(aOptions: AndroidOptions(encryptedSharedPreferences: true));

// ============ SHARED PREFERENCES ============
@Riverpod(keepAlive: true)
Future<SharedPreferences> sharedPreferences(Ref ref) async => SharedPreferences.getInstance();

// ============ OBJECTBOX DATABASE ============
@Riverpod(keepAlive: true)
Future<Store> objectboxStore(Ref ref) async {
  final dir = await getApplicationDocumentsDirectory();

  return openStore(directory: '${dir.path}/objectbox');
}

// ============ TOKEN STORAGE ============
@riverpod
class TokenStorage extends _$TokenStorage {
  @override
  FutureOr<void> build() async {
    // Initialize if needed
  }

  Future<void> saveTokens({required String accessToken, required String refreshToken}) async {
    final storage = ref.read(secureStorageProvider);
    await storage.write(key: 'access_token', value: accessToken);
    await storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<String?> getAccessToken() async {
    final storage = ref.read(secureStorageProvider);
    return storage.read(key: 'access_token');
  }

  Future<String?> getRefreshToken() async {
    final storage = ref.read(secureStorageProvider);
    return storage.read(key: 'refresh_token');
  }

  Future<void> clearTokens() async {
    final storage = ref.read(secureStorageProvider);
    await storage.delete(key: 'access_token');
    await storage.delete(key: 'refresh_token');
  }
}
