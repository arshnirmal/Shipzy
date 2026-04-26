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
        borderRadius: AppRadius.radiusXl,
        gradient: AppGradients.primaryCta,
        boxShadow: AppDepth.ambientShadow(theme.brightness),
      ),
      child: Stack(
        children: [
          // Decorative icon
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(Icons.local_shipping, size: 140, color: AppColors.onPrimaryCta.withValues(alpha: 0.15)),
          ),

          // Content
          Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Need a delivery?',
                  style: theme.textTheme.titleLarge?.copyWith(color: AppColors.onPrimaryCta, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 4),
                Text(
                  'Send anything, anywhere in minutes.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: AppColors.onPrimaryCta.withValues(alpha: 0.9),
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),
                Material(
                  color: AppColors.onPrimaryCta,
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
