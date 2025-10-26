// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'mapbox_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(mapboxService)
const mapboxServiceProvider = MapboxServiceProvider._();

final class MapboxServiceProvider
    extends $FunctionalProvider<MapboxService, MapboxService, MapboxService>
    with $Provider<MapboxService> {
  const MapboxServiceProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'mapboxServiceProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$mapboxServiceHash();

  @$internal
  @override
  $ProviderElement<MapboxService> $createElement($ProviderPointer pointer) =>
      $ProviderElement(pointer);

  @override
  MapboxService create(Ref ref) {
    return mapboxService(ref);
  }

  /// {@macro riverpod.override_with_value}
  Override overrideWithValue(MapboxService value) {
    return $ProviderOverride(
      origin: this,
      providerOverride: $SyncValueProvider<MapboxService>(value),
    );
  }
}

String _$mapboxServiceHash() => r'663003c37b082755ae82beaea96d3877e9b8e36e';
