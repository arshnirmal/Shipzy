// lib/providers/new_order_provider.dart

import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/orders/calculate_fare.dart';
import '../models/orders/create_order.dart';
import '../models/orders/create_order_data.dart';
import 'order_service_provider.dart';

part 'new_order_provider.g.dart';

/// State for the new order form
class NewOrderState {
  const NewOrderState({
    this.createOrderData,
    this.isLoadingData = false,
    this.dataError,
    this.selectedDeliveryType,
    this.selectedVehicle,
    this.selectedPackageType,
    this.selectedPaymentMethod,
    this.pickupAddress,
    this.pickupLatitude,
    this.pickupLongitude,
    this.pickupContactName,
    this.pickupContactPhone,
    this.deliveryAddress,
    this.deliveryLatitude,
    this.deliveryLongitude,
    this.deliveryContactName,
    this.deliveryContactPhone,
    this.packageWeight,
    this.packageDescription,
    this.declaredValue,
    this.specialInstructions,
    this.fareData,
    this.isCalculatingFare = false,
    this.fareError,
    this.isCreatingOrder = false,
    this.createOrderError,
    this.createdOrder,
  });
  final CreateOrderData? createOrderData;
  final bool isLoadingData;
  final String? dataError;

  // Order form data
  final DeliveryType? selectedDeliveryType;
  final Vehicle? selectedVehicle;
  final PackageType? selectedPackageType;
  final PaymentMethod? selectedPaymentMethod;

  // Address data
  final String? pickupAddress;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String? pickupContactName;
  final String? pickupContactPhone;

  final String? deliveryAddress;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  final String? deliveryContactName;
  final String? deliveryContactPhone;

  // Package data
  final double? packageWeight;
  final String? packageDescription;
  final double? declaredValue;
  final String? specialInstructions;

  // Fare calculation
  final FareData? fareData;
  final bool isCalculatingFare;
  final String? fareError;

  // Order creation
  final bool isCreatingOrder;
  final String? createOrderError;
  final CreatedOrderData? createdOrder;

  NewOrderState copyWith({
    CreateOrderData? createOrderData,
    bool? isLoadingData,
    String? dataError,
    DeliveryType? selectedDeliveryType,
    Vehicle? selectedVehicle,
    PackageType? selectedPackageType,
    PaymentMethod? selectedPaymentMethod,
    String? pickupAddress,
    double? pickupLatitude,
    double? pickupLongitude,
    String? pickupContactName,
    String? pickupContactPhone,
    String? deliveryAddress,
    double? deliveryLatitude,
    double? deliveryLongitude,
    String? deliveryContactName,
    String? deliveryContactPhone,
    double? packageWeight,
    String? packageDescription,
    double? declaredValue,
    String? specialInstructions,
    FareData? fareData,
    bool? isCalculatingFare,
    String? fareError,
    bool? isCreatingOrder,
    String? createOrderError,
    CreatedOrderData? createdOrder,
  }) => NewOrderState(
    createOrderData: createOrderData ?? this.createOrderData,
    isLoadingData: isLoadingData ?? this.isLoadingData,
    dataError: dataError ?? this.dataError,
    selectedDeliveryType: selectedDeliveryType ?? this.selectedDeliveryType,
    selectedVehicle: selectedVehicle ?? this.selectedVehicle,
    selectedPackageType: selectedPackageType ?? this.selectedPackageType,
    selectedPaymentMethod: selectedPaymentMethod ?? this.selectedPaymentMethod,
    pickupAddress: pickupAddress ?? this.pickupAddress,
    pickupLatitude: pickupLatitude ?? this.pickupLatitude,
    pickupLongitude: pickupLongitude ?? this.pickupLongitude,
    pickupContactName: pickupContactName ?? this.pickupContactName,
    pickupContactPhone: pickupContactPhone ?? this.pickupContactPhone,
    deliveryAddress: deliveryAddress ?? this.deliveryAddress,
    deliveryLatitude: deliveryLatitude ?? this.deliveryLatitude,
    deliveryLongitude: deliveryLongitude ?? this.deliveryLongitude,
    deliveryContactName: deliveryContactName ?? this.deliveryContactName,
    deliveryContactPhone: deliveryContactPhone ?? this.deliveryContactPhone,
    packageWeight: packageWeight ?? this.packageWeight,
    packageDescription: packageDescription ?? this.packageDescription,
    declaredValue: declaredValue ?? this.declaredValue,
    specialInstructions: specialInstructions ?? this.specialInstructions,
    fareData: fareData ?? this.fareData,
    isCalculatingFare: isCalculatingFare ?? this.isCalculatingFare,
    fareError: fareError ?? this.fareError,
    isCreatingOrder: isCreatingOrder ?? this.isCreatingOrder,
    createOrderError: createOrderError ?? this.createOrderError,
    createdOrder: createdOrder ?? this.createdOrder,
  );

  /// Check if all required fields are filled for fare calculation
  bool get canCalculateFare =>
      selectedDeliveryType != null &&
      selectedVehicle != null &&
      pickupLatitude != null &&
      pickupLongitude != null &&
      deliveryLatitude != null &&
      deliveryLongitude != null &&
      packageWeight != null &&
      selectedPackageType != null;

  /// Check if all required fields are filled for order creation
  bool get canCreateOrder =>
      canCalculateFare &&
      pickupAddress != null &&
      pickupContactName != null &&
      pickupContactPhone != null &&
      deliveryAddress != null &&
      deliveryContactName != null &&
      deliveryContactPhone != null &&
      selectedPaymentMethod != null &&
      packageDescription != null;

  /// Get the weight tier for current package weight
  WeightTier? get selectedWeightTier {
    if (selectedVehicle == null || packageWeight == null) {
      return null;
    }

    return selectedVehicle!.weightTiers.firstWhere(
      (tier) => packageWeight! >= tier.minWeightKg && packageWeight! <= tier.maxWeightKg,
      orElse: () => selectedVehicle!.weightTiers.last,
    );
  }

  /// Calculate total fare including weight charges
  double get totalFareWithWeight {
    if (fareData == null) {
      return 0;
    }
    final weightCharge = selectedWeightTier?.additionalCharge ?? 0.0;
    return fareData!.totalFare + weightCharge;
  }
}

@riverpod
class NewOrder extends _$NewOrder {
  @override
  NewOrderState build() => const NewOrderState();

  /// Load static data for creating orders
  Future<void> loadCreateOrderData() async {
    if (state.createOrderData != null) {
      return; // Already loaded
    }

    state = state.copyWith(isLoadingData: true);

    try {
      final orderService = ref.read(orderServiceProvider);
      final response = await orderService.getCreateOrderData();

      state = state.copyWith(createOrderData: response.data, isLoadingData: false);
    } catch (e) {
      state = state.copyWith(isLoadingData: false, dataError: e.toString());
    }
  }

  /// Select delivery type and reset dependent selections
  void selectDeliveryType(DeliveryType deliveryType) {
    // When delivery type changes, reset vehicle selection if not supported
    final supportedVehicleNames = deliveryType.supportedVehicles.map((v) => v.name).toSet();
    final currentVehicleSupported = state.selectedVehicle == null || supportedVehicleNames.contains(state.selectedVehicle!.name);

    state = state.copyWith(selectedDeliveryType: deliveryType, selectedVehicle: currentVehicleSupported ? state.selectedVehicle : null);
  }

  /// Select vehicle
  void selectVehicle(Vehicle vehicle) {
    state = state.copyWith(selectedVehicle: vehicle);
  }

  /// Select package type
  void selectPackageType(PackageType packageType) {
    state = state.copyWith(selectedPackageType: packageType);
  }

  /// Select payment method
  void selectPaymentMethod(PaymentMethod paymentMethod) {
    state = state.copyWith(selectedPaymentMethod: paymentMethod);
  }

  /// Set pickup address details
  void setPickupAddress({String? address, double? latitude, double? longitude, String? contactName, String? contactPhone}) {
    state = state.copyWith(
      pickupAddress: address ?? state.pickupAddress,
      pickupLatitude: latitude ?? state.pickupLatitude,
      pickupLongitude: longitude ?? state.pickupLongitude,
      pickupContactName: contactName ?? state.pickupContactName,
      pickupContactPhone: contactPhone ?? state.pickupContactPhone,
    );
  }

  /// Set delivery address details
  void setDeliveryAddress({String? address, double? latitude, double? longitude, String? contactName, String? contactPhone}) {
    state = state.copyWith(
      deliveryAddress: address ?? state.deliveryAddress,
      deliveryLatitude: latitude ?? state.deliveryLatitude,
      deliveryLongitude: longitude ?? state.deliveryLongitude,
      deliveryContactName: contactName ?? state.deliveryContactName,
      deliveryContactPhone: contactPhone ?? state.deliveryContactPhone,
    );
  }

  /// Set package details
  void setPackageDetails({double? weight, String? description}) {
    state = state.copyWith(packageWeight: weight ?? state.packageWeight, packageDescription: description ?? state.packageDescription);
  }

  /// Set declared value
  void setDeclaredValue(double? value) {
    state = state.copyWith(declaredValue: value);
  }

  /// Set special instructions
  void setSpecialInstructions(String? instructions) {
    state = state.copyWith(specialInstructions: instructions);
  }

  /// Calculate fare
  Future<void> calculateFare() async {
    if (!state.canCalculateFare) {
      return;
    }

    state = state.copyWith(isCalculatingFare: true);

    try {
      final orderService = ref.read(orderServiceProvider);
      final request = CalculateFareRequest(
        pickupLatitude: state.pickupLatitude!,
        pickupLongitude: state.pickupLongitude!,
        deliveryLatitude: state.deliveryLatitude!,
        deliveryLongitude: state.deliveryLongitude!,
        packageWeight: state.packageWeight!,
        packageType: state.selectedPackageType!.name,
        deliveryType: state.selectedDeliveryType!.name,
      );

      final response = await orderService.calculateFare(request);
      state = state.copyWith(fareData: response.data, isCalculatingFare: false);
    } catch (e) {
      state = state.copyWith(isCalculatingFare: false, fareError: e.toString());
    }
  }

  /// Create order
  Future<void> createOrder() async {
    if (!state.canCreateOrder) {
      return;
    }

    state = state.copyWith(isCreatingOrder: true);

    try {
      final orderService = ref.read(orderServiceProvider);
      final request = CreateOrderRequest(
        pickupAddress: state.pickupAddress!,
        pickupLatitude: state.pickupLatitude!,
        pickupLongitude: state.pickupLongitude!,
        pickupContactName: state.pickupContactName!,
        pickupContactPhone: state.pickupContactPhone!,
        deliveryAddress: state.deliveryAddress!,
        deliveryLatitude: state.deliveryLatitude!,
        deliveryLongitude: state.deliveryLongitude!,
        deliveryContactName: state.deliveryContactName!,
        deliveryContactPhone: state.deliveryContactPhone!,
        packageType: state.selectedPackageType!.name,
        packageWeight: state.packageWeight!,
        packageDescription: state.packageDescription!,
        deliveryType: state.selectedDeliveryType!.name,
        paymentMethod: state.selectedPaymentMethod!.name,
        declaredValue: state.declaredValue,
        specialInstructions: state.specialInstructions,
      );

      final response = await orderService.createOrder(request);
      state = state.copyWith(createdOrder: response.data, isCreatingOrder: false);
    } catch (e) {
      state = state.copyWith(isCreatingOrder: false, createOrderError: e.toString());
    }
  }

  /// Clear all form data
  void clearForm() {
    state = const NewOrderState();
  }

  /// Reset order creation state (after successful creation)
  void resetAfterOrderCreation() {
    state = state.copyWith(isCreatingOrder: false);
  }
}
