import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/earnings_summary.dart';
import '../models/trip_history_item.dart';
import '../services/api_service.dart';

// ── Filter state ──────────────────────────────────────────────────────────────

class TripsFilter {
  const TripsFilter({this.status = 'all', this.dateRange = 'week'});

  /// 'all' | 'delivered' | 'cancelled' | 'returned'
  final String status;

  /// 'today' | '7days' | 'week' | '30days' | 'month'
  final String dateRange;

  TripsFilter copyWith({String? status, String? dateRange}) => TripsFilter(
        status: status ?? this.status,
        dateRange: dateRange ?? this.dateRange,
      );

  bool get hasActiveFilter => status != 'all' || dateRange != 'week';
}

class TripsFilterNotifier extends StateNotifier<TripsFilter> {
  TripsFilterNotifier() : super(const TripsFilter());

  void setStatus(String s) => state = state.copyWith(status: s);
  void setDateRange(String r) => state = state.copyWith(dateRange: r);
  void clear() => state = const TripsFilter();
}

final tripsFilterProvider =
    StateNotifierProvider<TripsFilterNotifier, TripsFilter>(
  (ref) => TripsFilterNotifier(),
);

// ── Date range helpers ────────────────────────────────────────────────────────

(String, String) _dateRangeParams(String range) {
  final now = DateTime.now();
  final end = now.toIso8601String();
  switch (range) {
    case 'today':
      final start = DateTime(now.year, now.month, now.day);
      return (start.toIso8601String(), end);
    case '7days':
      return (now.subtract(const Duration(days: 7)).toIso8601String(), end);
    case '30days':
      return (now.subtract(const Duration(days: 30)).toIso8601String(), end);
    case 'month':
      final start = DateTime(now.year, now.month);
      return (start.toIso8601String(), end);
    case 'week':
    default:
      final start = DateTime(now.year, now.month, now.day - (now.weekday - 1));
      return (start.toIso8601String(), end);
  }
}

// ── Trips list ────────────────────────────────────────────────────────────────

const _kTerminalStatuses = {'delivered', 'cancelled', 'returned', 'undeliverable'};

/// All terminal trips for the selected date range — no status filter applied.
/// Used for chip counts and as the source for [tripsListProvider].
final allTerminalTripsProvider =
    FutureProvider.autoDispose<List<TripHistoryItem>>((ref) async {
  final dateRange =
      ref.watch(tripsFilterProvider.select((f) => f.dateRange));
  final (dateFrom, dateTo) = _dateRangeParams(dateRange);

  final data = await ref.read(apiServiceProvider).getTripHistory(
        dateFrom: dateFrom,
        dateTo: dateTo,
      );

  final rawTrips = (data['trips'] as List?) ?? [];
  return rawTrips
      .whereType<Map<String, dynamic>>()
      .map(TripHistoryItem.fromJson)
      .where((t) => _kTerminalStatuses.contains(t.status))
      .toList();
});

/// Status-filtered view of [allTerminalTripsProvider]. Does not trigger a
/// network request when the status chip changes.
final tripsListProvider =
    FutureProvider.autoDispose<List<TripHistoryItem>>((ref) async {
  final status =
      ref.watch(tripsFilterProvider.select((f) => f.status));
  final all = await ref.watch(allTerminalTripsProvider.future);
  if (status == 'all') {
    return all;
  }
  return all.where((t) => t.status == status).toList();
});

// ── Weekly summary (for the earnings banner) ──────────────────────────────────

final weeklyTripSummaryProvider =
    FutureProvider.autoDispose<EarningsSummary?>((ref) async {
  try {
    return await ref.read(apiServiceProvider).getDetailedEarnings('week');
  } catch (_) {
    return null;
  }
});

// ── Trip detail (full order from GET /orders/:id) ─────────────────────────────

final tripDetailProvider = FutureProvider.autoDispose
    .family<Map<String, dynamic>, int>(
  (ref, orderId) => ref.read(apiServiceProvider).getOrderById(orderId),
);

/// Holds the list-item tapped last, so the detail screen can show earnings
/// without an extra API round-trip.
final selectedTripProvider = StateProvider<TripHistoryItem?>((ref) => null);
