import 'package:flutter/material.dart';

class OtpScreen extends StatelessWidget {
  final String phoneNumber;
  
  const OtpScreen({required this.phoneNumber, super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Text('OTP Screen for $phoneNumber'),
      ),
    );
  }
}
