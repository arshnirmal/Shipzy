// lib/providers/address_provider.dart

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/saved_address.dart';
import '../services/address_service.dart';
import 'address_service_provider.dart';

// Provider for getting saved addresses
final savedAddressesProvider = FutureProvider<List<SavedAddress>>((ref) async {
  final addressService = ref.watch(addressServiceProvider);
  return addressService.getAddresses();
});

// Notifier for managing saved addresses (CRUD operations)
class SavedAddressesNotifier extends Notifier<AsyncValue<List<SavedAddress>>> {
  @override
  AsyncValue<List<SavedAddress>> build() {
    _loadAddresses();
    return const AsyncValue.loading();
  }

  AddressService get _addressService => ref.watch(addressServiceProvider);

  Future<void> _loadAddresses() async {
    try {
      state = const AsyncValue.loading();
      final addresses = await _addressService.getAddresses();
      state = AsyncValue.data(addresses);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  Future<void> addAddress(CreateAddress addressData) async {
    try {
      state = const AsyncValue.loading();
      await _addressService.saveAddress(addressData);
      // Reload addresses after adding
      await _loadAddresses();
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      // Reload addresses to restore previous state
      await _loadAddresses();
    }
  }

  Future<void> removeAddress(int addressId) async {
    try {
      state = const AsyncValue.loading();
      await _addressService.deleteAddress(addressId);
      // Reload addresses after deleting
      await _loadAddresses();
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      // Reload addresses to restore previous state
      await _loadAddresses();
    }
  }

  Future<void> refresh() async {
    await _loadAddresses();
  }
}

final savedAddressesNotifierProvider = NotifierProvider<SavedAddressesNotifier, AsyncValue<List<SavedAddress>>>(SavedAddressesNotifier.new);
