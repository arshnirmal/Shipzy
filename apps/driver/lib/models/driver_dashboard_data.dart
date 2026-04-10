import 'active_order.dart';
import 'driver_profile.dart';

class DriverDashboardData {
  const DriverDashboardData({required this.profile, this.activeAssignment});

  final DriverProfile profile;
  final ActiveAssignment? activeAssignment;
}
