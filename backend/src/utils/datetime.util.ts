// services/backend/src/utils/datetime.util.ts
// Centralized helpers for strict ISO datetime serialization.

function parseDateLike(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") {
    return new Date(value);
  }
  throw new Error(`Unsupported datetime value type: ${typeof value}`);
}

export function toIsoDateTime(value: unknown): string {
  const parsed = parseDateLike(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid datetime value: ${String(value)}`);
  }
  return parsed.toISOString();
}

export function toIsoDateTimeOrUndefined(
  value: unknown,
): string | undefined {
  if (value == null) return undefined;
  return toIsoDateTime(value);
}

export function toIsoDateTimeOrNull(value: unknown): string | null {
  if (value == null) return null;
  return toIsoDateTime(value);
}

