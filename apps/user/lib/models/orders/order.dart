import 'package:freezed_annotation/freezed_annotation.dart';

import 'order_status.dart';

part 'order.freezed.dart';
part 'order.g.dart';

@freezed
abstract class Order with _$Order {
  const factory Order({
    @JsonKey(readValue: _readOrderId) @Default(0) int orderId,
    @JsonKey(readValue: _readOrderUuid) @Default('') String orderUuid,
    @JsonKey(readValue: _readOrderNumber) @Default('') String orderNumber,
    @JsonKey(readValue: _readStatus, fromJson: _statusFromJson, toJson: _statusToJson)
    @Default(OrderStatus.pending)
    OrderStatus status,
    @JsonKey(readValue: _readStatusId) int? statusId,
    @JsonKey(readValue: _readDeliveryTypeId) int? deliveryTypeId,
    @JsonKey(readValue: _readDeliveryTypeDisplay) String? deliveryTypeDisplay,
    @JsonKey(readValue: _readVehicleCategoryId) int? vehicleCategoryId,
    @JsonKey(readValue: _readVehicleCategoryDisplay) String? vehicleCategoryDisplay,
    @JsonKey(readValue: _readTotalPrice, fromJson: _doubleFromJson, toJson: _doubleToJson)
    @Default(0.0)
    double totalPrice,
    @JsonKey(readValue: _readCreatedAt, fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
    required DateTime createdAt,
    @JsonKey(readValue: _readUpdatedAt, fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
    required DateTime updatedAt,
    @JsonKey(readValue: _readPickup) required OrderLocation pickup,
    @JsonKey(readValue: _readDelivery) required OrderLocation delivery,
    @JsonKey(readValue: _readClient) OrderClient? client,
    @JsonKey(readValue: _readPricing) required OrderFareBreakdown fareBreakdown,
    @JsonKey(readValue: _readPackageDescription) String? packageDescription,
    @JsonKey(readValue: _readPackageTypeId) int? packageTypeId,
    @JsonKey(readValue: _readWeightTierId) int? weightTierId,
    @JsonKey(readValue: _readWeightTierDisplay) String? weightTierDisplay,
    @JsonKey(readValue: _readSpecialInstructions) String? specialInstructions,
    @JsonKey(readValue: _readEstimatedDistanceKm, fromJson: _nullableDoubleFromJson, toJson: _nullableDoubleToJson)
    double? estimatedDistanceKm,
    @JsonKey(readValue: _readActualDistanceKm, fromJson: _nullableDoubleFromJson, toJson: _nullableDoubleToJson)
    double? actualDistanceKm,
    @JsonKey(readValue: _readActualDurationMins) int? actualDurationMins,
    @JsonKey(readValue: _readEstimatedDurationMins, fromJson: _nullableDoubleFromJson, toJson: _nullableDoubleToJson)
    double? estimatedDurationMins,
    @JsonKey(readValue: _readAcceptedAt, fromJson: _nullableDateTimeFromJson, toJson: _nullableDateTimeToJson)
    DateTime? acceptedAt,
    @JsonKey(readValue: _readPickedUpAt, fromJson: _nullableDateTimeFromJson, toJson: _nullableDateTimeToJson)
    DateTime? pickedUpAt,
    @JsonKey(readValue: _readDeliveredAt, fromJson: _nullableDateTimeFromJson, toJson: _nullableDateTimeToJson)
    DateTime? deliveredAt,
    @JsonKey(readValue: _readCancelledAt, fromJson: _nullableDateTimeFromJson, toJson: _nullableDateTimeToJson)
    DateTime? cancelledAt,
    @JsonKey(readValue: _readCancellationReason) String? cancellationReason,
    @JsonKey(readValue: _readPayment) OrderPayment? payment,
    @JsonKey(readValue: _readCourier) OrderCourier? courier,
    @JsonKey(readValue: _readRating) OrderRating? rating,
  }) = _Order;

  const Order._();

  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);

  String get pickupAddress => pickup.address;
  String get deliveryAddress => delivery.address;
  String get pickupContact => pickup.contactName ?? '';
  String get deliveryContact => delivery.contactName ?? '';
  String get packageType => packageDescription ?? 'Package';
  double get totalFare => totalPrice;
  double? get distance => actualDistanceKm ?? estimatedDistanceKm;
  String? get packageWeight => weightTierDisplay;
  DateTime get statusTimestamp => cancelledAt ?? deliveredAt ?? pickedUpAt ?? acceptedAt ?? createdAt;
}

@freezed
abstract class OrderLocation with _$OrderLocation {
  const factory OrderLocation({
    @JsonKey(name: 'fullAddress') @Default('') String address,
    int? addressId,
    String? building,
    String? floor,
    @JsonKey(name: 'flatNumber') String? flat,
    String? landmark,
    String? city,
    String? state,
    String? postalCode,
    @JsonKey(fromJson: _nullableDoubleFromJson, toJson: _nullableDoubleToJson)
    double? latitude,
    @JsonKey(fromJson: _nullableDoubleFromJson, toJson: _nullableDoubleToJson)
    double? longitude,
    String? contactName,
    String? contactPhone,
    String? howToReach,
  }) = _OrderLocation;

  factory OrderLocation.fromJson(Map<String, dynamic> json) =>
      _$OrderLocationFromJson(json);
}

@freezed
abstract class OrderPayment with _$OrderPayment {
  const factory OrderPayment({String? paymentMethod, OrderFareBreakdown? fareBreakdown}) =
      _OrderPayment;

  factory OrderPayment.fromJson(Map<String, dynamic> json) =>
      _$OrderPaymentFromJson(json);
}

@freezed
abstract class OrderFareBreakdown with _$OrderFareBreakdown {
  const factory OrderFareBreakdown({
    @Default(0.0) double basePrice,
    @Default(0.0) double distanceKm,
    @Default(0.0) double distancePrice,
    @Default(0.0) double weightSurcharge,
    @Default(0.0) double platformFee,
    @Default(0.0) double specialHandlingFee,
    @Default(0.0) double subtotalBeforeTax,
    @Default(0.0) double gstAmount,
    @Default(0.0) double totalPrice,
    @Default('INR') String currency,
  }) = _OrderFareBreakdown;

  factory OrderFareBreakdown.fromJson(Map<String, dynamic> json) =>
      _$OrderFareBreakdownFromJson(json);
}

@freezed
abstract class OrderClient with _$OrderClient {
  const factory OrderClient({required int userId, String? name, String? phone, String? profilePictureUrl}) =
      _OrderClient;

  factory OrderClient.fromJson(Map<String, dynamic> json) =>
      _$OrderClientFromJson(json);
}

@freezed
abstract class OrderCourier with _$OrderCourier {
  const factory OrderCourier({
    required int userId,
    String? name,
    String? phone,
    OrderCourierVehicle? vehicle,
    OrderCourierRating? rating,
    String? profilePictureUrl,
  }) = _OrderCourier;

  factory OrderCourier.fromJson(Map<String, dynamic> json) =>
      _$OrderCourierFromJson(json);
}

@freezed
abstract class OrderCourierVehicle with _$OrderCourierVehicle {
  const factory OrderCourierVehicle({
    required int vehicleId,
    required int categoryId,
    required String category,
    required bool isActive,
    required String vehicleNumber,
    required String model,
    required int year,
  }) = _OrderCourierVehicle;

  factory OrderCourierVehicle.fromJson(Map<String, dynamic> json) =>
      _$OrderCourierVehicleFromJson(json);
}

@freezed
abstract class OrderCourierRating with _$OrderCourierRating {
  const factory OrderCourierRating({required double averageRating, required int totalRatings}) =
      _OrderCourierRating;

  factory OrderCourierRating.fromJson(Map<String, dynamic> json) =>
      _$OrderCourierRatingFromJson(json);
}

@freezed
abstract class OrderRating with _$OrderRating {
  const factory OrderRating({
    required int ratingId,
    required int orderId,
    required int rating,
    required bool isAnonymous,
    required DateTime createdAt,
    String? comment,
  }) = _OrderRating;

  factory OrderRating.fromJson(Map<String, dynamic> json) =>
      _$OrderRatingFromJson(json);
}

Object? _readNested(Map<dynamic, dynamic> json, List<String> path) {
  dynamic current = json;
  for (final part in path) {
    if (current is Map<dynamic, dynamic>) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}

Object? _readOrderId(Map<dynamic, dynamic> json, String _) => _readNested(json, ['identifiers', 'orderId']) ?? json['orderId'];
Object? _readOrderUuid(Map<dynamic, dynamic> json, String _) => _readNested(json, ['identifiers', 'orderUuid']) ?? json['orderUuid'];
Object? _readOrderNumber(Map<dynamic, dynamic> json, String _) => _readNested(json, ['identifiers', 'orderNumber']) ?? json['orderNumber'];
Object? _readStatus(Map<dynamic, dynamic> json, String _) => json['status'];
Object? _readStatusId(Map<dynamic, dynamic> json, String _) => json['statusId'];
Object? _readDeliveryTypeId(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'deliveryTypeId']) ?? json['deliveryTypeId'];
Object? _readDeliveryTypeDisplay(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'deliveryTypeDisplay']) ?? json['deliveryTypeDisplay'];
Object? _readVehicleCategoryId(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'vehicleCategoryId']) ?? json['vehicleCategoryId'];
Object? _readVehicleCategoryDisplay(Map<dynamic, dynamic> json, String _) =>
    _readNested(json, ['fulfillment', 'vehicleCategoryDisplay']) ?? json['vehicleCategoryDisplay'];
Object? _readTotalPrice(Map<dynamic, dynamic> json, String _) => _readNested(json, ['metrics', 'totalPrice']) ?? _readNested(json, ['pricing', 'totalPrice']) ?? json['totalPrice'];
Object? _readCreatedAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'createdAt']) ?? json['createdAt'];
Object? _readUpdatedAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'updatedAt']) ?? json['updatedAt'] ?? _readCreatedAt(json, 'createdAt');
Object? _readPickup(Map<dynamic, dynamic> json, String _) => _readNested(json, ['locations', 'pickup']) ?? json['pickup'] ?? <String, dynamic>{};
Object? _readDelivery(Map<dynamic, dynamic> json, String _) => _readNested(json, ['locations', 'delivery']) ?? json['delivery'] ?? <String, dynamic>{};
Object? _readClient(Map<dynamic, dynamic> json, String _) => _readNested(json, ['actors', 'client']) ?? json['client'];
Object? _readPricing(Map<dynamic, dynamic> json, String _) => _readNested(json, ['pricing']) ?? json['fareBreakdown'] ?? <String, dynamic>{};
Object? _readPackageDescription(Map<dynamic, dynamic> json, String _) => _readNested(json, ['package', 'description']) ?? json['packageDescription'];
Object? _readPackageTypeId(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'packageTypeId']) ?? json['packageTypeId'];
Object? _readWeightTierId(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'weightTierId']) ?? json['weightTierId'];
Object? _readWeightTierDisplay(Map<dynamic, dynamic> json, String _) => _readNested(json, ['fulfillment', 'weightTierDisplay']) ?? json['weightTierDisplay'];
Object? _readSpecialInstructions(Map<dynamic, dynamic> json, String _) => _readNested(json, ['package', 'specialInstructions']) ?? json['specialInstructions'];
Object? _readEstimatedDistanceKm(Map<dynamic, dynamic> json, String _) => _readNested(json, ['metrics', 'estimatedDistanceKm']) ?? json['estimatedDistanceKm'];
Object? _readActualDistanceKm(Map<dynamic, dynamic> json, String _) => _readNested(json, ['metrics', 'actualDistanceKm']) ?? json['actualDistanceKm'];
Object? _readActualDurationMins(Map<dynamic, dynamic> json, String _) => _readNested(json, ['metrics', 'actualDurationMins']) ?? json['actualDurationMins'];
Object? _readEstimatedDurationMins(Map<dynamic, dynamic> json, String _) => _readNested(json, ['metrics', 'estimatedDurationMins']) ?? json['estimatedDurationMins'];
Object? _readAcceptedAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'acceptedAt']) ?? _readNested(json, ['assignment', 'timeline', 'acceptedAt']);
Object? _readPickedUpAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'pickedUpAt']);
Object? _readDeliveredAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'deliveredAt']);
Object? _readCancelledAt(Map<dynamic, dynamic> json, String _) => _readNested(json, ['timeline', 'cancelledAt']);
Object? _readCancellationReason(Map<dynamic, dynamic> json, String _) => _readNested(json, ['cancellation', 'reason']) ?? json['cancellationReason'];
Object? _readPayment(Map<dynamic, dynamic> json, String _) => json['payment'];
Object? _readCourier(Map<dynamic, dynamic> json, String _) => _readNested(json, ['actors', 'courier']) ?? json['courier'];
Object? _readRating(Map<dynamic, dynamic> json, String _) => json['rating'];

OrderStatus _statusFromJson(dynamic rawStatus) => OrderStatusX.fromApi('${rawStatus ?? 'pending'}');
String _statusToJson(OrderStatus status) => status.name;

double _doubleFromJson(dynamic value) {
  if (value is num) return value.toDouble();
  return double.tryParse('${value ?? 0}') ?? 0.0;
}

double _doubleToJson(double value) => value;

double? _nullableDoubleFromJson(dynamic value) {
  if (value == null) return null;
  if (value is num) return value.toDouble();
  return double.tryParse('$value');
}

double? _nullableDoubleToJson(double? value) => value;

DateTime _dateTimeFromJson(dynamic value) {
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value) ?? DateTime.fromMillisecondsSinceEpoch(0);
  return DateTime.fromMillisecondsSinceEpoch(0);
}

String _dateTimeToJson(DateTime value) => value.toIso8601String();

DateTime? _nullableDateTimeFromJson(dynamic value) {
  if (value == null) return null;
  if (value is DateTime) return value;
  if (value is String) return DateTime.tryParse(value);
  return null;
}

String? _nullableDateTimeToJson(DateTime? value) => value?.toIso8601String();
