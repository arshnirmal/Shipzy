import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:upi_india/upi_india.dart';

import 'upi_payment_service.dart';

part 'upi_provider.g.dart';

@riverpod
UpiPaymentService upiPaymentService(Ref ref) => UpiPaymentService();

@riverpod
Future<List<UpiApp>> availableUpiApps(Ref ref) async {
  final service = ref.watch(upiPaymentServiceProvider);
  return service.getAvailableUpiApps();
}
