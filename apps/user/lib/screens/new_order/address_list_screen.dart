import 'package:flutter/material.dart';

/// Screen for displaying the user's saved addresses.
///
/// Shows a list of all addresses associated with the user's account.
class AddressListScreen extends StatelessWidget {
  /// Creates an [AddressListScreen].
  const AddressListScreen({super.key});

  @override
  Widget build(BuildContext context) =>
      const Scaffold(body: Center(child: Text('Address List Screen')));
}
