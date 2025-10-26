import 'package:logger/logger.dart';

/// Centralized logging utility for the Shipzy application.
///
/// This class provides static methods for logging messages at different levels
/// (debug, info, warning, error, fatal) using the logger package with pretty printing.
class AppLogger {
  static late Logger _logger;

  /// Initializes the logger with pretty printing configuration.
  ///
  /// Must be called before using any logging methods.
  static void init() {
    _logger = Logger(printer: PrettyPrinter(methodCount: 0, errorMethodCount: 5));
  }

  /// Logs a debug message.
  ///
  /// [message] - The message to log
  /// [error] - Optional error object
  /// [stackTrace] - Optional stack trace
  static void d(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.d(message, error: error, stackTrace: stackTrace);
  }

  /// Logs an info message.
  ///
  /// [message] - The message to log
  /// [error] - Optional error object
  /// [stackTrace] - Optional stack trace
  static void i(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.i(message, error: error, stackTrace: stackTrace);
  }

  /// Logs a warning message.
  ///
  /// [message] - The message to log
  /// [error] - Optional error object
  /// [stackTrace] - Optional stack trace
  static void w(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.w(message, error: error, stackTrace: stackTrace);
  }

  /// Logs an error message.
  ///
  /// [message] - The message to log
  /// [error] - Optional error object
  /// [stackTrace] - Optional stack trace
  static void e(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.e(message, error: error, stackTrace: stackTrace);
  }

  /// Logs a fatal message.
  ///
  /// [message] - The message to log
  /// [error] - Optional error object
  /// [stackTrace] - Optional stack trace
  static void f(String message, {Object? error, StackTrace? stackTrace}) {
    _logger.f(message, error: error, stackTrace: stackTrace);
  }
}
