// lib/services/location_queue.dart
// SQLite-backed offline queue for location updates.
// Stores updates when the network is unavailable and drains them in order on reconnect.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:path/path.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:sqflite/sqflite.dart';

import '../utils/logger.dart';

part 'location_queue.g.dart';

@riverpod
Future<LocationQueue> locationQueue(Ref ref) async {
  final q = LocationQueue();
  await q.open();
  return q;
}

class LocationQueueEntry {
  const LocationQueueEntry({
    required this.id,
    required this.latitude,
    required this.longitude,
    required this.timestamp,
    this.speed,
    this.bearing,
    this.accuracy,
  });

  final int id;
  final double latitude;
  final double longitude;
  final double? speed;
  final double? bearing;
  final double? accuracy;
  final DateTime timestamp;
}

class LocationQueue {
  Database? _db;

  Future<void> open() async {
    final dbPath = await getDatabasesPath();
    _db = await openDatabase(
      join(dbPath, 'shipzy_location_queue.db'),
      version: 1,
      onCreate: (db, version) async {
        await db.execute('''
          CREATE TABLE location_queue (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude  REAL    NOT NULL,
            longitude REAL    NOT NULL,
            speed     REAL,
            bearing   REAL,
            accuracy  REAL,
            timestamp TEXT    NOT NULL
          )
        ''');
      },
    );
  }

  // Removes entries older than 15 minutes — plan §9 offline queue bounds.
  Future<void> _evictStale() async {
    final cutoff = DateTime.now().subtract(const Duration(minutes: 15));
    await _db?.delete('location_queue', where: 'timestamp < ?', whereArgs: [cutoff.toIso8601String()]);
  }

  Future<void> enqueue({
    required double latitude,
    required double longitude,
    double? speed,
    double? bearing,
    double? accuracy,
  }) async {
    try {
      await _evictStale();
      await _db?.insert('location_queue', {
        'latitude': latitude,
        'longitude': longitude,
        'speed': speed,
        'bearing': bearing,
        'accuracy': accuracy,
        'timestamp': DateTime.now().toIso8601String(),
      });
    } catch (e) {
      AppLogger.w('Location queue enqueue failed: $e');
    }
  }

  Future<List<LocationQueueEntry>> peek(int limit) async {
    final rows = await _db?.query(
          'location_queue',
          orderBy: 'id ASC',
          limit: limit,
        ) ??
        [];
    return rows.map(_fromRow).toList();
  }

  // Returns the most-recent entries (newest first) — used for flush-one-on-reconnect drain.
  Future<List<LocationQueueEntry>> peekLatest(int limit) async {
    final rows = await _db?.query(
          'location_queue',
          orderBy: 'id DESC',
          limit: limit,
        ) ??
        [];
    return rows.map(_fromRow).toList();
  }

  Future<void> dequeue(int id) async {
    await _db?.delete('location_queue', where: 'id = ?', whereArgs: [id]);
  }

  Future<void> clear() async {
    await _db?.delete('location_queue');
  }

  Future<int> count() async {
    final result = await _db?.rawQuery('SELECT COUNT(*) as c FROM location_queue');
    return (result?.first['c'] as int?) ?? 0;
  }

  LocationQueueEntry _fromRow(Map<String, dynamic> row) => LocationQueueEntry(
        id: row['id'] as int,
        latitude: row['latitude'] as double,
        longitude: row['longitude'] as double,
        speed: row['speed'] as double?,
        bearing: row['bearing'] as double?,
        accuracy: row['accuracy'] as double?,
        timestamp: DateTime.parse(row['timestamp'] as String),
      );
}
