import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../services/auth_service.dart';
import '../services/dio/api_client.dart';

part 'auth_service_provider.g.dart';

@riverpod
AuthService authService(Ref ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AuthService(apiClient);
}

