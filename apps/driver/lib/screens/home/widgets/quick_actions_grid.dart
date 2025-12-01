import 'package:flutter/material.dart';

class QuickActionsGrid extends StatelessWidget {
  const QuickActionsGrid({super.key});

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 16),
        child: Text('Quick Actions', style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
      ),
      Row(
        children: [
          Expanded(child: _buildActionCard(context, 'Earnings', Icons.account_balance_wallet, Colors.purple, () {})),
          const SizedBox(width: 12),
          Expanded(child: _buildActionCard(context, 'History', Icons.history, Colors.orange, () {})),
          const SizedBox(width: 12),
          Expanded(child: _buildActionCard(context, 'Support', Icons.headset_mic, Colors.blue, () {})),
        ],
      ),
    ],
  );

  Widget _buildActionCard(BuildContext context, String label, IconData icon, Color color, VoidCallback onTap) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: theme.cardColor,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: theme.dividerColor),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withOpacity(0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 8),
            Text(label, style: theme.textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
