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
    this.pickupBaseAddress,
    this.pickupLatitude,
    this.pickupLongitude,
    this.pickupCity,
    this.pickupState,
    this.pickupPostalCode,
    this.pickupContactName,
    this.pickupContactPhone,
    this.pickupBuilding,
    this.pickupFloor,
    this.pickupFlat,
    this.pickupHowToReach,
    this.deliveryAddress,
    this.deliveryBaseAddress,
    this.deliveryLatitude,
    this.deliveryLongitude,
    this.deliveryCity,
    this.deliveryState,
    this.deliveryPostalCode,
    this.deliveryContactName,
    this.deliveryContactPhone,
    this.deliveryBuilding,
    this.deliveryFloor,
    this.deliveryFlat,
    this.deliveryHowToReach,
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
  final String? pickupBaseAddress;
  final double? pickupLatitude;
  final double? pickupLongitude;
  final String? pickupCity;
  final String? pickupState;
  final String? pickupPostalCode;
  final String? pickupContactName;
  final String? pickupContactPhone;
  final String? pickupBuilding;
  final String? pickupFloor;
  final String? pickupFlat;
  final String? pickupHowToReach;

  final String? deliveryAddress;
  final String? deliveryBaseAddress;
  final double? deliveryLatitude;
  final double? deliveryLongitude;
  final String? deliveryCity;
  final String? deliveryState;
  final String? deliveryPostalCode;
  final String? deliveryContactName;
  final String? deliveryContactPhone;
  final String? deliveryBuilding;
  final String? deliveryFloor;
  final String? deliveryFlat;
  final String? deliveryHowToReach;

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
    String? pickupBaseAddress,
    double? pickupLatitude,
    double? pickupLongitude,
    String? pickupCity,
    String? pickupState,
    String? pickupPostalCode,
    String? pickupContactName,
    String? pickupContactPhone,
    String? pickupBuilding,
    String? pickupFloor,
    String? pickupFlat,
    String? pickupHowToReach,
    String? deliveryAddress,
    String? deliveryBaseAddress,
    double? deliveryLatitude,
    double? deliveryLongitude,
    String? deliveryCity,
    String? deliveryState,
    String? deliveryPostalCode,
    String? deliveryContactName,
    String? deliveryContactPhone,
    String? deliveryBuilding,
    String? deliveryFloor,
    String? deliveryFlat,
    String? deliveryHowToReach,
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
    pickupBaseAddress: pickupBaseAddress ?? this.pickupBaseAddress,
    pickupLatitude: pickupLatitude ?? this.pickupLatitude,
    pickupLongitude: pickupLongitude ?? this.pickupLongitude,
    pickupCity: pickupCity ?? this.pickupCity,
    pickupState: pickupState ?? this.pickupState,
    pickupPostalCode: pickupPostalCode ?? this.pickupPostalCode,
    pickupContactName: pickupContactName ?? this.pickupContactName,
    pickupContactPhone: pickupContactPhone ?? this.pickupContactPhone,
    pickupBuilding: pickupBuilding ?? this.pickupBuilding,
    pickupFloor: pickupFloor ?? this.pickupFloor,
    pickupFlat: pickupFlat ?? this.pickupFlat,
    pickupHowToReach: pickupHowToReach ?? this.pickupHowToReach,
    deliveryAddress: deliveryAddress ?? this.deliveryAddress,
    deliveryBaseAddress: deliveryBaseAddress ?? this.deliveryBaseAddress,
    deliveryLatitude: deliveryLatitude ?? this.deliveryLatitude,
    deliveryLongitude: deliveryLongitude ?? this.deliveryLongitude,
    deliveryCity: deliveryCity ?? this.deliveryCity,
    deliveryState: deliveryState ?? this.deliveryState,
    deliveryPostalCode: deliveryPostalCode ?? this.deliveryPostalCode,
    deliveryContactName: deliveryContactName ?? this.deliveryContactName,
    deliveryContactPhone: deliveryContactPhone ?? this.deliveryContactPhone,
    deliveryFloor: deliveryFloor ?? this.deliveryFloor,
    deliveryFlat: deliveryFlat ?? this.deliveryFlat,
    deliveryHowToReach: deliveryHowToReach ?? this.deliveryHowToReach,
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
      packageWeight != null;

  /// Check if all required fields are filled for order creation
  bool get canCreateOrder =>
      canCalculateFare &&
      deliveryContactName != null &&
      deliveryContactName!.trim().isNotEmpty &&
      deliveryContactPhone != null &&
      deliveryContactPhone!.trim().length >= 10 &&
      selectedPaymentMethod != null;

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

  /// Get total fare (already includes all charges from API)
  double get totalFare => fareData?.totalPrice ?? 0.0;
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
  void setPickupAddress({
    String? address,
    String? baseAddress,
    double? latitude,
    double? longitude,
    String? city,
    String? stateOrProvince,
    String? postalCode,
    String? contactName,
    String? contactPhone,
    String? building,
    String? floor,
    String? flat,
    String? howToReach,
  }) {
    state = state.copyWith(
      pickupAddress: address ?? state.pickupAddress,
      pickupBaseAddress: baseAddress ?? state.pickupBaseAddress,
      pickupLatitude: latitude ?? state.pickupLatitude,
      pickupLongitude: longitude ?? state.pickupLongitude,
      pickupCity: city ?? state.pickupCity,
      pickupState: stateOrProvince ?? state.pickupState,
      pickupPostalCode: postalCode ?? state.pickupPostalCode,
      pickupContactName: contactName ?? state.pickupContactName,
      pickupContactPhone: contactPhone ?? state.pickupContactPhone,
      pickupBuilding: building ?? state.pickupBuilding,
      pickupFloor: floor ?? state.pickupFloor,
      pickupFlat: flat ?? state.pickupFlat,
      pickupHowToReach: howToReach ?? state.pickupHowToReach,
    );
  }

  /// Set delivery address details
  void setDeliveryAddress({
    String? address,
    String? baseAddress,
    double? latitude,
    double? longitude,
    String? city,
    String? stateOrProvince,
    String? postalCode,
    String? contactName,
    String? contactPhone,
    String? building,
    String? floor,
    String? flat,
    String? howToReach,
  }) {
    state = state.copyWith(
      deliveryAddress: address ?? state.deliveryAddress,
      deliveryBaseAddress: baseAddress ?? state.deliveryBaseAddress,
      deliveryLatitude: latitude ?? state.deliveryLatitude,
      deliveryLongitude: longitude ?? state.deliveryLongitude,
      deliveryCity: city ?? state.deliveryCity,
      deliveryState: stateOrProvince ?? state.deliveryState,
      deliveryPostalCode: postalCode ?? state.deliveryPostalCode,
      deliveryContactName: contactName ?? state.deliveryContactName,
      deliveryContactPhone: contactPhone ?? state.deliveryContactPhone,
      deliveryBuilding: building ?? state.deliveryBuilding,
      deliveryFloor: floor ?? state.deliveryFloor,
      deliveryFlat: flat ?? state.deliveryFlat,
      deliveryHowToReach: howToReach ?? state.deliveryHowToReach,
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

    // Get the weight tier for the current package weight
    final weightTier = state.selectedWeightTier;
    if (weightTier == null) {
      state = state.copyWith(fareError: 'Unable to determine weight tier for package weight');
      return;
    }

    state = state.copyWith(isCalculatingFare: true);

    try {
      final orderService = ref.read(orderServiceProvider);
      final request = CalculateFareRequest(
        deliveryTypeId: state.selectedDeliveryType!.deliveryTypeId,
        vehicleCategoryId: state.selectedVehicle!.categoryId,
        weightTierId: weightTier.tierId,
        pickup: Coordinate(latitude: state.pickupLatitude!, longitude: state.pickupLongitude!),
        drop: Coordinate(latitude: state.deliveryLatitude!, longitude: state.deliveryLongitude!),
      );

      final response = await orderService.calculateFare(request);
      state = state.copyWith(fareData: response.data, isCalculatingFare: false);
    } catch (e) {
      state = state.copyWith(isCalculatingFare: false, fareError: e.toString());
    }
  }

  /// Validate order details
  String? validateOrder() {
    if (state.pickupAddress == null) {
      return 'Please select pickup address';
    }
    if (state.pickupContactName == null || state.pickupContactName!.trim().isEmpty) {
      return 'Please enter pickup contact name';
    }
    if (state.pickupContactPhone == null || state.pickupContactPhone!.trim().length < 10) {
      return 'Please enter valid 10-digit pickup phone';
    }

    if (state.deliveryAddress == null) {
      return 'Please select delivery address';
    }
    // Delivery contact details are optional - not required for order creation

    if (state.packageWeight == null || state.packageWeight! <= 0) {
      return 'Please enter valid package weight';
    }
    if (state.deliveryContactName == null || state.deliveryContactName!.trim().isEmpty) {
      return 'Please enter delivery contact name';
    }
    if (state.deliveryContactPhone == null || state.deliveryContactPhone!.trim().length < 10) {
      return 'Please enter valid 10-digit delivery phone';
    }
    if (state.selectedPaymentMethod == null) {
      return 'Please select payment method';
    }

    return null;
  }

  /// Create order
  Future<void> createOrder() async {
    final validationError = validateOrder();
    if (validationError != null) {
      state = state.copyWith(createOrderError: validationError);
      return;
    }

    if (!state.canCreateOrder) {
      return;
    }

    // Ensure we have fare data
    if (state.fareData == null) {
      state = state.copyWith(createOrderError: 'Please calculate fare before creating order');
      return;
    }

    // Get weight tier
    final weightTier = state.selectedWeightTier;
    if (weightTier == null) {
      state = state.copyWith(createOrderError: 'Unable to determine weight tier');
      return;
    }

    state = state.copyWith(isCreatingOrder: true);

    try {
      final orderService = ref.read(orderServiceProvider);
      final request = CreateOrderRequest(
        deliveryTypeId: state.selectedDeliveryType!.deliveryTypeId,
        vehicleCategoryId: state.selectedVehicle!.categoryId,
        weightTierId: weightTier.tierId,
        paymentMethodId: state.selectedPaymentMethod!.methodId,
        pickup: CreateOrderPickup(
          fullAddress: state.pickupAddress!,
          latitude: state.pickupLatitude!,
          longitude: state.pickupLongitude!,
          city: state.pickupCity ?? 'Unknown',
          state: state.pickupState ?? 'Unknown',
          postalCode: state.pickupPostalCode ?? '000000',
          contactName: state.pickupContactName!,
          contactPhone: state.pickupContactPhone!,
          howToReach: state.pickupHowToReach,
          building: state.pickupBuilding,
          floor: state.pickupFloor,
          flatNumber: state.pickupFlat,
        ),
        delivery: CreateOrderDelivery(
          fullAddress: state.deliveryAddress!,
          latitude: state.deliveryLatitude!,
          longitude: state.deliveryLongitude!,
          city: state.deliveryCity ?? 'Unknown',
          state: state.deliveryState ?? 'Unknown',
          postalCode: state.deliveryPostalCode ?? '000000',
          contactName: state.deliveryContactName!,
          contactPhone: state.deliveryContactPhone!,
          howToReach: state.deliveryHowToReach,
          building: state.deliveryBuilding,
          floor: state.deliveryFloor,
          flatNumber: state.deliveryFlat,
        ),
        fareBreakdown: FareBreakdown(
          basePrice: state.fareData!.basePrice,
          distanceKm: state.fareData!.distanceKm,
          distancePrice: state.fareData!.distancePrice,
          weightSurcharge: state.fareData!.weightSurcharge,
          platformFee: state.fareData!.platformFee,
          specialHandlingFee: state.fareData!.specialHandlingFee,
          subtotalBeforeTax: state.fareData!.subtotalBeforeTax,
          gstAmount: state.fareData!.gstAmount,
          totalPrice: state.fareData!.totalPrice,
          currency: state.fareData!.currency,
        ),
        packageTypeId: state.selectedPackageType?.packageTypeId,
        packageDescription: state.packageDescription,
        specialInstructions: state.specialInstructions,
        declaredValue: state.declaredValue,
      );

      final response = await orderService.createOrder(request);
      state = state.copyWith(createdOrder: response.data, isCreatingOrder: false);
    } catch (e) {
      state = state.copyWith(isCreatingOrder: false, createOrderError: e.toString());
    }
  }

  /// Clear all form data
  void clearForm() {
    state = NewOrderState(createOrderData: state.createOrderData);
  }

  /// Reset order creation state (after successful creation)
  void resetAfterOrderCreation() {
    state = state.copyWith(isCreatingOrder: false);
  }
}
