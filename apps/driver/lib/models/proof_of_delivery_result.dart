import 'package:freezed_annotation/freezed_annotation.dart';

part 'proof_of_delivery_result.freezed.dart';
part 'proof_of_delivery_result.g.dart';

@freezed
class ProofOfDeliveryResult with _$ProofOfDeliveryResult {
  const factory ProofOfDeliveryResult({required int proofId, required int orderId, required DateTime deliveredAt}) = _ProofOfDeliveryResult;

  factory ProofOfDeliveryResult.fromJson(Map<String, dynamic> json) => _$ProofOfDeliveryResultFromJson(json);
}
