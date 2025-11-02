// lib/providers/order_service_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../services/dio/api_client.dart';
import '../services/order_service.dart';

part 'order_service_provider.g.dart';

@riverpod
OrderService orderService(Ref ref) {
  final apiClient = ref.watch(apiClientProvider);

  return OrderService(apiClient);
}
