import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'package:riverpod/riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

// ignore: depend_on_referenced_packages
import '../objectbox.g.dart';

// ============ SECURE STORAGE ============
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) => const FlutterSecureStorage());

// ============ SHARED PREFERENCES ============
final sharedPreferencesProvider = Provider<Future<SharedPreferences>>((ref) => SharedPreferences.getInstance());

// ============ OBJECTBOX DATABASE ============
final objectboxStoreProvider = Provider<Future<Store>>((ref) async {
  final dir = await getApplicationDocumentsDirectory();
  return openStore(directory: '${dir.path}/objectbox');
});

// ============ TOKEN STORAGE ============
final tokenStorageProvider = Provider<TokenStorage>(TokenStorage.new);

class TokenStorage {
  TokenStorage(this.ref);
  final Ref ref;

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
