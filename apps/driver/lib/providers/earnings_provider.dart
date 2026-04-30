import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/earnings_summary.dart';
import '../models/trip_history_item.dart';
import '../services/api_service.dart';

// ── Period ─────────────────────────────────────────────────────────────────────

const _kValidPeriods = {'today', 'week', 'month', 'year'};

class EarningsPeriodNotifier extends Notifier<String> {
  static const _kKey = 'earnings_period';

  @override
  String build() {
    _loadPersisted();
    return 'week';
  }

  Future<void> _loadPersisted() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_kKey);
    if (saved != null && _kValidPeriods.contains(saved)) {
      state = saved;
    }
  }

  Future<void> setPeriod(String period) async {
    state = period;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kKey, period);
  }
}

final earningsPeriodProvider =
    NotifierProvider<EarningsPeriodNotifier, String>(EarningsPeriodNotifier.new);

// ── Earnings summary (for external consumers / stats) ─────────────────────────

final earningsSummaryProvider =
    FutureProvider.autoDispose<EarningsSummary>((ref) {
  final period = ref.watch(earningsPeriodProvider);
  return ref.read(apiServiceProvider).getDetailedEarnings(period);
});

// ── Trips for current period ───────────────────────────────────────────────────

final earningsTripsProvider =
    FutureProvider.autoDispose<List<TripHistoryItem>>((ref) async {
  final period = ref.watch(earningsPeriodProvider);
  final (dateFrom, dateTo) = _periodDateRange(period);
  final data = await ref.read(apiServiceProvider).getTripHistory(
        dateFrom: dateFrom,
        dateTo: dateTo,
      );
  final rawTrips = (data['trips'] as List?) ?? [];
  return rawTrips
      .whereType<Map<String, dynamic>>()
      .map(TripHistoryItem.fromJson)
      .toList();
});

// ── Previous period total (delta badge in hero card) ──────────────────────────

final earningsPrevAmountProvider =
    FutureProvider.autoDispose<double>((ref) async {
  final period = ref.watch(earningsPeriodProvider);
  final (dateFrom, dateTo) = _previousPeriodDateRange(period);
  if (dateFrom.isEmpty) {
    return 0;
  }
  final data = await ref.read(apiServiceProvider).getTripHistory(
        dateFrom: dateFrom,
        dateTo: dateTo,
      );
  final rawTrips = (data['trips'] as List?) ?? [];
  return rawTrips.whereType<Map<String, dynamic>>().fold<double>(
        0,
        (s, t) => s + ((t['earnings'] as num?)?.toDouble() ?? 0),
      );
});

// ── Goals (persisted locally) ──────────────────────────────────────────────────

const _kDefaultGoals = <String, double>{
  'today': 500,
  'week': 3500,
  'month': 12000,
  'year': 60000,
};

class EarningsGoalNotifier extends Notifier<Map<String, double>> {
  static const _kPrefix = 'earnings_goal_';

  @override
  Map<String, double> build() {
    _loadPersisted();
    return Map.from(_kDefaultGoals);
  }

  Future<void> _loadPersisted() async {
    final prefs = await SharedPreferences.getInstance();
    final loaded = <String, double>{};
    for (final p in _kDefaultGoals.keys) {
      loaded[p] = prefs.getDouble('$_kPrefix$p') ?? _kDefaultGoals[p]!;
    }
    state = loaded;
  }

  Future<void> setGoal(String period, double amount) async {
    state = {...state, period: amount};
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble('$_kPrefix$period', amount);
  }
}

final earningsGoalProvider =
    NotifierProvider<EarningsGoalNotifier, Map<String, double>>(
  EarningsGoalNotifier.new,
);

// ── Date range helpers ─────────────────────────────────────────────────────────

(String, String) _periodDateRange(String period) {
  final now = DateTime.now();
  final end = now.toIso8601String();
  switch (period) {
    case 'today':
      return (DateTime(now.year, now.month, now.day).toIso8601String(), end);
    case 'week':
      final start =
          DateTime(now.year, now.month, now.day - (now.weekday - 1));
      return (start.toIso8601String(), end);
    case 'month':
      return (DateTime(now.year, now.month).toIso8601String(), end);
    case 'year':
      return (DateTime(now.year).toIso8601String(), end);
    default:
      return (now.subtract(const Duration(days: 7)).toIso8601String(), end);
  }
}

(String, String) _previousPeriodDateRange(String period) {
  final now = DateTime.now();
  switch (period) {
    case 'today':
      final y = now.subtract(const Duration(days: 1));
      return (
        DateTime(y.year, y.month, y.day).toIso8601String(),
        DateTime(now.year, now.month, now.day).toIso8601String(),
      );
    case 'week':
      final s =
          DateTime(now.year, now.month, now.day - (now.weekday - 1));
      return (
        s.subtract(const Duration(days: 7)).toIso8601String(),
        s.toIso8601String(),
      );
    case 'month':
      return (
        DateTime(now.year, now.month - 1).toIso8601String(),
        DateTime(now.year, now.month).toIso8601String(),
      );
    case 'year':
      return (
        DateTime(now.year - 1).toIso8601String(),
        DateTime(now.year).toIso8601String(),
      );
    default:
      return ('', '');
  }
}
