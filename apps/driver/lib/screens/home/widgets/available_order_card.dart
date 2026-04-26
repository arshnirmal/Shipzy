import 'package:flutter/material.dart';

import '../../../models/available_order.dart';

class AvailableOrderCard extends StatefulWidget {
  const AvailableOrderCard({
    required this.order,
    required this.onAccept,
    required this.onReject,
    super.key,
  });

  final AvailableOrderItem order;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  State<AvailableOrderCard> createState() => _AvailableOrderCardState();
}

class _AvailableOrderCardState extends State<AvailableOrderCard> {
  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
