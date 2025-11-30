import 'package:flutter/material.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

class MapWidget extends StatefulWidget {
  const MapWidget({super.key});

  @override
  State<MapWidget> createState() => _MapWidgetState();
}

class _MapWidgetState extends State<MapWidget> {
  MapboxMap? _mapboxMap;

  _onMapCreated(MapboxMap mapboxMap) {
    _mapboxMap = mapboxMap;
    // TODO: Customize map style and settings
  }

  @override
  Widget build(BuildContext context) {
    return const Placeholder();
  }
}
