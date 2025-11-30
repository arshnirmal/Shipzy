import 'package:freezed_annotation/freezed_annotation.dart';

part 'driver_home_state.freezed.dart';

enum DriverStatus { offline, online, onDelivery }

@freezed
class DriverHomeState with _$DriverHomeState {
  const factory DriverHomeState({
    @Default(DriverStatus.offline) DriverStatus status,
    @Default(false) bool isLoading,
    String? error,
    // We will add other fields like stats, activeOrder, etc. here or manage them in separate providers
    // For a single state object, it's often easier to keep them together
  }) = _DriverHomeState;
}
