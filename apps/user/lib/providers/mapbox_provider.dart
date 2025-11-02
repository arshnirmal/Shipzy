import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../services/mapbox_service.dart';

part 'mapbox_provider.g.dart';

@riverpod
MapboxService mapboxService(Ref ref) => MapboxService();
