import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/new_order_provider.dart';
import '../../utils/slide_in_animation.dart';
import '../../utils/snackbar_utils.dart';
// Import the corrected widgets
import 'widgets/delivery_type_selector.dart';
import 'widgets/location_section.dart';
import 'widgets/package_section.dart';
import 'widgets/payment_section.dart';
import 'widgets/price_action_bar.dart';
import 'widgets/vehicle_selector.dart';

class NewOrderScreen extends ConsumerStatefulWidget {
  const NewOrderScreen({super.key});

  @override
  ConsumerState<NewOrderScreen> createState() => _NewOrderScreenState();
}

class _NewOrderScreenState extends ConsumerState<NewOrderScreen> {
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    // Load static data once
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(newOrderProvider.notifier).loadCreateOrderData();
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }

  void _debouncedFareCalc() {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      ref.read(newOrderProvider.notifier).calculateFare();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(newOrderProvider);
    final notifier = ref.read(newOrderProvider.notifier);

    // Listen for any field changes that require fare recompute
    ref.listen<NewOrderState>(newOrderProvider, (prev, next) {
      final keyChanged =
          prev?.selectedDeliveryType?.name != next.selectedDeliveryType?.name ||
          prev?.selectedVehicle?.name != next.selectedVehicle?.name ||
          prev?.pickupLatitude != next.pickupLatitude ||
          prev?.pickupLongitude != next.pickupLongitude ||
          prev?.deliveryLatitude != next.deliveryLatitude ||
          prev?.deliveryLongitude != next.deliveryLongitude ||
          prev?.packageWeight != next.packageWeight ||
          prev?.selectedPackageType?.name != next.selectedPackageType?.name;

      if (keyChanged && next.canCalculateFare) {
        _debouncedFareCalc();
      }
    });

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.close), onPressed: () => context.pop()),
        title: const Text('New Order'),
        actions: [
          TextButton(
            onPressed: notifier.clearForm,
            child: Text('Clear', style: TextStyle(color: Theme.of(context).colorScheme.primary)),
          ),
        ],
      ),
      body: Stack(
        children: [
          if (state.isLoadingData)
            const Center(child: CircularProgressIndicator())
          else if (state.dataError != null)
            Center(
              child: Text(state.dataError!, style: const TextStyle(color: Colors.red)),
            )
          else
            SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 120),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SlideInAnimation(child: DeliveryTypeSelector(onChanged: notifier.selectDeliveryType)),
                  const SizedBox(height: 20),
                  if (state.selectedDeliveryType != null) ...[
                    SlideInAnimation(index: 1, child: VehicleSelector(onChanged: notifier.selectVehicle)),
                    const SizedBox(height: 20),
                  ],
                  if (state.selectedVehicle != null) ...[
                    SlideInAnimation(
                      index: 2,
                      child: LocationSection(
                        onPickupChanged: (addr, lat, lng, name, phone) =>
                            notifier.setPickupAddress(address: addr, latitude: lat, longitude: lng, contactName: name, contactPhone: phone),
                        onDeliveryChanged: (addr, lat, lng, name, phone) =>
                            notifier.setDeliveryAddress(address: addr, latitude: lat, longitude: lng, contactName: name, contactPhone: phone),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (state.pickupLatitude != null && state.deliveryLatitude != null) ...[
                    SlideInAnimation(
                      index: 3,
                      child: PackageSection(
                        onWeightChanged: (w) => notifier.setPackageDetails(weight: w),
                        onCategoryChanged: notifier.selectPackageType,
                        onDescriptionChanged: (desc) => notifier.setPackageDetails(description: desc),
                        onDeclaredValueChanged: notifier.setDeclaredValue,
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                  if (state.selectedPackageType != null) ...[
                    SlideInAnimation(index: 4, child: PaymentSection(onChanged: notifier.selectPaymentMethod)),
                    const SizedBox(height: 16),
                  ],
                  if (state.fareError != null)
                    SlideInAnimation(
                      index: 5,
                      child: Text(state.fareError!, style: const TextStyle(color: Colors.red)),
                    ),
                ],
              ),
            ),
          // Bottom price + action
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: PriceActionBar(
              onCreate: () async {
                // trigger
                await notifier.createOrder();
                // read fresh state after await
                final current = ref.read(newOrderProvider);
                // guard all context usages
                if (!context.mounted) {
                  return;
                }
                if (current.createOrderError == null && current.createdOrder != null) {
                  context.pop();
                  if (!context.mounted) {
                    return;
                  }
                  SnackbarUtils.showSuccess(context, 'Order created successfully');
                  notifier.resetAfterOrderCreation();
                } else {
                  SnackbarUtils.showError(context, 'Failed to create order: ${current.createOrderError}');
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
