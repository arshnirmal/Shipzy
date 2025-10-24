// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'upi_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(upiPaymentService)
const upiPaymentServiceProvider = UpiPaymentServiceProvider._();

final class UpiPaymentServiceProvider
    extends
        $FunctionalProvider<
          UpiPaymentService,
          UpiPaymentService,
          UpiPaymentService
        >
    with $Provider<UpiPaymentService> {
  const UpiPaymentServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'upiPaymentServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$upiPaymentServiceHash();

  @$internal
  @override
  $ProviderElement<UpiPaymentService> $createElement(
    $ProviderPointer pointer,
  ) => $ProviderElement(pointer);

  @override
  UpiPaymentService create(Ref ref) {
    return upiPaymentService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(UpiPaymentService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<UpiPaymentService>(value),
    );
  }
}

String _$upiPaymentServiceHash() => r'e98e659d801201c4ae5a34b88686e4bba768b61b';

@ProviderFor(availableUpiApps)
const availableUpiAppsProvider = AvailableUpiAppsProvider._();

final class AvailableUpiAppsProvider
    extends
        $FunctionalProvider<
          AsyncValue<List<UpiApp>>,
          List<UpiApp>,
          FutureOr<List<UpiApp>>
        >
    with $FutureModifier<List<UpiApp>>, $FutureProvider<List<UpiApp>> {
  const AvailableUpiAppsProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'availableUpiAppsProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$availableUpiAppsHash();

  @$internal
  @override
  $FutureProviderElement<List<UpiApp>> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<List<UpiApp>> create(Ref ref) {
    return availableUpiApps(ref);
  }
}

String _$availableUpiAppsHash() => r'e96e796d17cd363962f7dcb847fa3d0582e76fac';
