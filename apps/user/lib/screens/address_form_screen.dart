import 'package:flutter/material.dart';

/// Screen for creating or editing user addresses.
///
/// Allows users to add new addresses or modify existing ones.
/// [addressId] is null for new addresses and contains the ID for existing addresses.
class AddressFormScreen extends StatelessWidget {
  /// Creates an [AddressFormScreen].
  ///
  /// [addressId] - The ID of the address to edit, or null for creating a new address.
  const AddressFormScreen({super.key, this.addressId});

  /// The ID of the address to edit, or null for creating a new address.
  final String? addressId;

  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('Address Form Screen - ${addressId ?? 'New'}')));
}
