import 'package:freezed_annotation/freezed_annotation.dart';

part 'api_error.freezed.dart';
part 'api_error.g.dart';

@freezed
abstract class ApiFieldError with _$ApiFieldError {
  const factory ApiFieldError({
    required String field,
    required String message,
  }) = _ApiFieldError;

  factory ApiFieldError.fromJson(Map<String, dynamic> json) =>
      _$ApiFieldErrorFromJson(json);
}

@freezed
abstract class ApiErrorResponse with _$ApiErrorResponse {
  const factory ApiErrorResponse({
    required bool success,
    required String message,
    List<ApiFieldError>? errors,
    DateTime? timestamp,
  }) = _ApiErrorResponse;

  factory ApiErrorResponse.fromJson(Map<String, dynamic> json) =>
      _$ApiErrorResponseFromJson(json);
}
