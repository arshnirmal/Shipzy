import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../services/address_service.dart';
import '../services/dio/api_client.dart';

part 'address_service_provider.g.dart';

@riverpod
AddressService addressService(Ref ref) {
  final apiClient = ref.watch(apiClientProvider);
  return AddressService(apiClient);
}
