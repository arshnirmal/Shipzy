import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:intl/intl.dart';

class DateUtils {
  /// IST Offset is UTC + 5:30
  static const Duration istOffset = Duration(hours: 5, minutes: 30);

  /// Converts a UTC DateTime to IST.
  static DateTime toIst(DateTime utcDateTime) {
    return utcDateTime.toUtc().add(istOffset);
  }

  /// Parses a string (usually ISO UTC) and returns a DateTime in IST.
  static DateTime? parseIst(String? dateString) {
    if (dateString == null) return null;
    final parsed = DateTime.tryParse(dateString);
    if (parsed == null) return null;
    return toIst(parsed);
  }

  /// Formats a DateTime in IST using the given pattern.
  static String formatIst(DateTime dt, String pattern) {
    final istDt = toIst(dt);
    return DateFormat(pattern).format(istDt);
  }
}

/// A global converter for json_serializable that ensures all DateTime
/// fields are automatically converted to IST during deserialization.
class IstDateTimeConverter implements JsonConverter<DateTime, String> {
  const IstDateTimeConverter();

  @override
  DateTime fromJson(String json) {
    final dt = DateTime.parse(json);
    return DateUtils.toIst(dt);
  }

  @override
  String toJson(DateTime object) {
    // When sending back to server, convert back to UTC
    return object.subtract(DateUtils.istOffset).toUtc().toIso8601String();
  }
}

/// Same as above but handles nullable DateTime
class NullableIstDateTimeConverter implements JsonConverter<DateTime?, String?> {
  const NullableIstDateTimeConverter();

  @override
  DateTime? fromJson(String? json) {
    if (json == null) return null;
    return DateUtils.parseIst(json);
  }

  @override
  String? toJson(DateTime? object) {
    if (object == null) return null;
    return object.subtract(DateUtils.istOffset).toUtc().toIso8601String();
  }
}

extension DateTimeIstX on DateTime {
  /// Returns a new DateTime instance adjusted to IST (+5:30).
  /// Use this instead of .toLocal() if you want to force IST regardless of device timezone.
  DateTime get toIst => DateUtils.toIst(this);
}

extension StringIstX on String {
  /// Parses the string as a DateTime and returns it adjusted to IST.
  DateTime? get toIstDateTime => DateUtils.parseIst(this);
}
