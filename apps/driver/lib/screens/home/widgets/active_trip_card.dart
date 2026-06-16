import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../models/active_order.dart';
import '../../../models/order_address.dart';
import '../../../models/order_types.dart';
import '../../../providers/home_provider.dart';
import '../../../theme/app_palette.dart';
import '../../../theme/app_theme_extension.dart';
import '../../../utils/app_routes.dart';

class ActiveTripCard extends ConsumerWidget {
  const ActiveTripCard({super.key});

  Future<void> _launchNavigation(double lat, double lng) async {
    final googleUri = Uri.parse('google.navigation:q=$lat,$lng&mode=d');
    if (await canLaunchUrl(googleUri)) {
      await launchUrl(googleUri);
      return;
    }
    final webUri = Uri.parse(
      'https://www.google.com/maps/dir/?api=1&destination=$lat,$lng&travelmode=driving',
    );
    if (await canLaunchUrl(webUri)) {
      await launchUrl(webUri, mode: LaunchMode.externalApplication);
    }
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri.parse('tel:${phone.replaceAll(' ', '')}');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  _TripCardPhase _phaseFor(ActiveAssignment order) {
    switch (order.assignmentStatus.order) {
      case AssignmentOrderStatus.accepted:
        return _TripCardPhase(
          stepLabel: 'HEAD TO PICKUP',
          actionLabel: 'Continue Pickup',
          actionIcon: Icons.route_outlined,
          address: order.routing.pickup,
          isPickupPhase: true,
        );
      case AssignmentOrderStatus.pickedUp:
        return _TripCardPhase(
          stepLabel: 'READY FOR DROPOFF',
          actionLabel: 'Start Drop-off',
          actionIcon: Icons.navigation_rounded,
          address: order.routing.delivery,
        );
      case AssignmentOrderStatus.inTransit:
        return _TripCardPhase(
          stepLabel: 'HEAD TO DROP-OFF',
          actionLabel: 'Continue Delivery',
          actionIcon: Icons.location_on_outlined,
          address: order.routing.delivery,
        );
      case AssignmentOrderStatus.undeliverable:
        return _TripCardPhase(
          stepLabel: 'UNDELIVERABLE',
          actionLabel: 'Start Return',
          actionIcon: Icons.assignment_return_outlined,
          address: order.routing.pickup,
          isExceptionPhase: true,
        );
      case AssignmentOrderStatus.returning:
        return _TripCardPhase(
          stepLabel: 'RETURN TO SENDER',
          actionLabel: 'Continue Return',
          actionIcon: Icons.u_turn_left_rounded,
          address: order.routing.pickup,
          isExceptionPhase: true,
        );
      case AssignmentOrderStatus.returned:
        return _TripCardPhase(
          stepLabel: 'RETURNED',
          actionLabel: 'Review Return',
          actionIcon: Icons.check_circle_outline,
          address: order.routing.pickup,
          isExceptionPhase: true,
        );
      case AssignmentOrderStatus.delivered:
        return _TripCardPhase(
          stepLabel: 'DELIVERED',
          actionLabel: 'Add Proof',
          actionIcon: Icons.fact_check_outlined,
          address: order.routing.delivery,
        );
      default:
        return _TripCardPhase(
          stepLabel: 'ACTIVE TRIP',
          actionLabel: 'Open Trip',
          actionIcon: Icons.open_in_new_rounded,
          address: order.routing.delivery ?? order.routing.pickup,
        );
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final activeOrderAsync = ref.watch(activeOrderProvider);
    final theme = Theme.of(context);
    final themeExt = theme.extension<AppThemeExtension>();
    final isDark = theme.brightness == Brightness.dark;

    final order = activeOrderAsync.valueOrNull;
    if (order == null) {
      return const SizedBox.shrink();
    }

    final phase = _phaseFor(order);
    final targetAddress = phase.address;

    final targetLat = targetAddress?.latitude ?? 0.0;
    final targetLng = targetAddress?.longitude ?? 0.0;

    final barGradient = phase.isPickupPhase
        ? (themeExt?.primaryGradient ?? AppPalette.primaryGradientLight)
        : phase.isExceptionPhase
        ? LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [AppPalette.darkTertiary, const Color(0xFF2E7D62)]
                : [AppPalette.lightTertiary, const Color(0xFF2E7D62)],
          )
        : LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [AppPalette.darkError, const Color(0xFFE05555)]
                : [AppPalette.lightError, const Color(0xFFE05555)],
          );

    final contactName = targetAddress?.contactName ?? 'Customer';
    final contactPhone = targetAddress?.contactPhone ?? '';
    final areaName = targetAddress?.city ?? '';
    final fullAddress = targetAddress?.fullAddress ?? '';
    final packageTypeName = order.snapshot.packageType?.name;
    final weightTierName = order.snapshot.weightTier?.name;
    final distanceKm =
        order.routing.estimatedDistanceKm ?? order.routing.actualDistanceKm;
    final earningsNet = order.earnings.net;
    final orderNumber =
        order.assignment.orderNumber ?? 'ORD-${order.assignment.orderId}';

    final accentColor = phase.isPickupPhase
        ? (isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary)
        : phase.isExceptionPhase
        ? (isDark ? AppPalette.darkTertiary : AppPalette.lightTertiary)
        : (isDark ? AppPalette.darkError : AppPalette.lightError);
    final accentBgColor = phase.isPickupPhase
        ? theme.colorScheme.primaryContainer
        : phase.isExceptionPhase
        ? theme.colorScheme.tertiaryContainer
        : theme.colorScheme.errorContainer;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12),
      clipBehavior: Clip.hardEdge,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: isDark ? 0.4 : 0.12),
            blurRadius: 40,
            offset: const Offset(0, -8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _TopBar(
            stepLabel: phase.stepLabel,
            areaName: areaName,
            address: fullAddress,
            gradient: barGradient,
            onNavigate: () => _launchNavigation(targetLat, targetLng),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 20, 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _OrderInfoRow(
                  orderNumber: orderNumber,
                  packageType: packageTypeName,
                  weightTier: weightTierName,
                  distanceKm: distanceKm,
                  earningsNet: earningsNet,
                  accentColor: accentColor,
                  accentBgColor: accentBgColor,
                  isDark: isDark,
                ),
                const SizedBox(height: 12),
                _CustomerRow(
                  name: contactName,
                  phone: contactPhone,
                  gradient: themeExt?.primaryGradient,
                  isDark: isDark,
                  onCall: contactPhone.isNotEmpty
                      ? () => _launchPhone(contactPhone)
                      : null,
                ),
                const SizedBox(height: 14),
                _TripActionButton(
                  label: phase.actionLabel,
                  icon: phase.actionIcon,
                  gradient: barGradient,
                  onPressed: () => context.push(
                    AppRoutes.activeDeliveryPath(
                      order.assignment.orderId.toString(),
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

class _TripCardPhase {
  const _TripCardPhase({
    required this.stepLabel,
    required this.actionLabel,
    required this.actionIcon,
    required this.address,
    this.isPickupPhase = false,
    this.isExceptionPhase = false,
  });

  final String stepLabel;
  final String actionLabel;
  final IconData actionIcon;
  final OrderAddress? address;
  final bool isPickupPhase;
  final bool isExceptionPhase;
}

// ── Gradient top bar ──────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  const _TopBar({
    required this.stepLabel,
    required this.areaName,
    required this.address,
    required this.gradient,
    required this.onNavigate,
  });

  final String stepLabel;
  final String areaName;
  final String address;
  final LinearGradient gradient;
  final VoidCallback onNavigate;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(gradient: gradient),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  stepLabel,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: Colors.white.withValues(alpha: 0.75),
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 2),
                if (areaName.isNotEmpty)
                  Text(
                    areaName,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                if (address.isNotEmpty)
                  Text(
                    address,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontWeight: FontWeight.w500,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: onNavigate,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.navigation_rounded,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'NAVIGATE',
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 9,
                      letterSpacing: 0.5,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Order info row ────────────────────────────────────────────────

class _OrderInfoRow extends StatelessWidget {
  const _OrderInfoRow({
    required this.orderNumber,
    required this.packageType,
    required this.weightTier,
    required this.distanceKm,
    required this.earningsNet,
    required this.accentColor,
    required this.accentBgColor,
    required this.isDark,
  });

  final String orderNumber;
  final String? packageType;
  final String? weightTier;
  final double? distanceKm;
  final double earningsNet;
  final Color accentColor;
  final Color accentBgColor;
  final bool isDark;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    final title = [
      orderNumber,
      if (packageType != null) packageType!,
    ].join(' · ');

    final subtitle = [
      if (weightTier != null) weightTier!,
      if (distanceKm != null) '${distanceKm!.toStringAsFixed(1)} km total',
    ].join(' · ');

    return Row(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: accentBgColor,
            borderRadius: BorderRadius.circular(10),
          ),
          alignment: Alignment.center,
          child: Icon(Icons.inventory_2_outlined, color: accentColor, size: 16),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: theme.textTheme.labelLarge?.copyWith(
                  fontWeight: FontWeight.w700,
                  color: theme.colorScheme.onSurface,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              if (subtitle.isNotEmpty)
                Text(
                  subtitle,
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '₹${earningsNet.toStringAsFixed(0)}',
          style: theme.textTheme.titleMedium?.copyWith(
            color: isDark ? AppPalette.darkPrimary : AppPalette.lightPrimary,
            fontWeight: FontWeight.w800,
          ),
        ),
      ],
    );
  }
}

// ── Customer contact row ──────────────────────────────────────────

class _CustomerRow extends StatelessWidget {
  const _CustomerRow({
    required this.name,
    required this.phone,
    required this.isDark,
    this.gradient,
    this.onCall,
  });

  final String name;
  final String phone;
  final bool isDark;
  final LinearGradient? gradient;
  final VoidCallback? onCall;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerLow,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 34,
            height: 34,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: gradient,
              color: gradient == null
                  ? theme.colorScheme.primaryContainer
                  : null,
            ),
            alignment: Alignment.center,
            child: const Icon(Icons.person, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  name,
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (phone.isNotEmpty)
                  Text(
                    phone,
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
              ],
            ),
          ),
          if (onCall != null)
            GestureDetector(
              onTap: onCall,
              child: Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark
                      ? AppPalette.darkTertiary
                      : AppPalette.lightTertiary,
                  boxShadow: [
                    BoxShadow(
                      color:
                          (isDark
                                  ? AppPalette.darkTertiary
                                  : AppPalette.lightTertiary)
                              .withValues(alpha: 0.35),
                      blurRadius: 10,
                      offset: const Offset(0, 3),
                    ),
                  ],
                ),
                alignment: Alignment.center,
                child: const Icon(Icons.phone, color: Colors.white, size: 15),
              ),
            ),
        ],
      ),
    );
  }
}

// ── Primary action button ─────────────────────────────────────────

class _TripActionButton extends StatelessWidget {
  const _TripActionButton({
    required this.label,
    required this.icon,
    required this.gradient,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final LinearGradient gradient;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: gradient.colors.first.withValues(alpha: 0.35),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
