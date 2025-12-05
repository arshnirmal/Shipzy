import 'active_order.dart';
import 'driver_profile.dart';

class DriverDashboardData {
  const DriverDashboardData({required this.profile, this.activeOrder});

  final DriverProfile profile;
  final ActiveOrder? activeOrder;
}
