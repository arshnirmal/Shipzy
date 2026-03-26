// lib/screens/home/widgets/cta_card.dart

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../theme/design_tokens.dart';
import '../../../utils/app_routes.dart';

class CTACard extends StatelessWidget {
  const CTACard({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.colorScheme.primary;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: primaryColor,
        borderRadius: AppRadius.radiusLg,
        gradient: AppGradients.primaryCta,
        boxShadow: [BoxShadow(color: primaryColor.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0, 8))],
      ),
      child: Stack(
        children: [
          // Decorative Icon
          Positioned(right: -20, bottom: -20, child: Icon(Icons.local_shipping, size: 140, color: Colors.white.withValues(alpha: 0.15))),

          // Content
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need a delivery?',
                  style: theme.textTheme.titleLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Send anything, anywhere in minutes.',
                  style: theme.textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.9), fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: AppSpacing.lg),
                Material(
                  color: Colors.white,
                  borderRadius: AppRadius.radiusLg,
                  child: InkWell(
                    onTap: () => context.push(AppRoutes.createOrder),
                    borderRadius: AppRadius.radiusLg,
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Start delivery',
                            style: TextStyle(color: primaryColor, fontWeight: FontWeight.w600, fontSize: 14),
                          ),
                          const SizedBox(width: 8),
                          Icon(Icons.arrow_forward, size: 18, color: primaryColor),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
