import 'package:flutter/material.dart';

class OtpScreen extends StatelessWidget {
  const OtpScreen({required this.phoneNumber, super.key});
  final String phoneNumber;

  @override
  Widget build(BuildContext context) => Scaffold(body: Center(child: Text('OTP Screen for $phoneNumber')));
}
