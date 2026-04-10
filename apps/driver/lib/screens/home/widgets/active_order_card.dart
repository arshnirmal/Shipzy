import 'package:flutter/material.dart';

import '../../../models/active_order.dart';

class ActiveOrderCard extends StatelessWidget {
  const ActiveOrderCard({
    required this.order,
    required this.onNavigate,
    required this.onCall,
    this.onMarkPickedUp,
    this.onMarkDelivered,
    super.key,
  });

  final ActiveAssignment order;
  final VoidCallback onNavigate;
  final VoidCallback onCall;
  final VoidCallback? onMarkPickedUp;
  final VoidCallback? onMarkDelivered;

  @override
  Widget build(BuildContext context) => const SizedBox.shrink();
}
