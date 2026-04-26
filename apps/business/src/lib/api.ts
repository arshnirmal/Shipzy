// ─────────────────────────────────────────────────────────────────────────────
// Shipzy Business — API client
//
// All requests route through the Next.js BFF proxy (/api/proxy/*) so that
// HttpOnly auth cookies are automatically attached server-side.
// ─────────────────────────────────────────────────────────────────────────────

// ── Error taxonomy ───────────────────────────────────────────────────────────

/** Base class for all Shipzy API errors. */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

/** The fetch itself threw — device is offline or DNS failed. */
export class NetworkError extends ApiError {
  constructor(cause?: unknown) {
    super("No internet connection. Please check your network.", 0, cause);
    this.name = "NetworkError";
  }
}

/** Request exceeded the configured timeout before a response arrived. */
export class TimeoutError extends ApiError {
  constructor() {
    super("The request timed out. Please try again.", 408);
    this.name = "TimeoutError";
  }
}

/** 401 after a failed token refresh attempt — session has truly expired. */
export class AuthError extends ApiError {
  constructor(message = "Your session has expired. Please sign in again.", details?: unknown) {
    super(message, 401, details);
    this.name = "AuthError";
  }
}

/** 403 — authenticated but not authorized for this resource. */
export class ForbiddenError extends ApiError {
  constructor(message = "You don't have permission to perform this action.", details?: unknown) {
    super(message, 403, details);
    this.name = "ForbiddenError";
  }
}

/** 404 — resource does not exist. */
export class NotFoundError extends ApiError {
  constructor(message = "The requested resource was not found.", details?: unknown) {
    super(message, 404, details);
    this.name = "NotFoundError";
  }
}

/** 400 / 422 — invalid request payload (field-level errors may be in details). */
export class ValidationError extends ApiError {
  constructor(message = "Invalid request. Please check your input.", details?: unknown) {
    super(message, 422, details);
    this.name = "ValidationError";
  }
}

/** 5xx / 502 — backend or infrastructure failure. */
export class ServerError extends ApiError {
  constructor(message = "Something went wrong on our end. Please try again shortly.", statusCode = 500, details?: unknown) {
    super(message, statusCode, details);
    this.name = "ServerError";
  }
}

// ── Retry predicate ──────────────────────────────────────────────────────────

/**
 * Returns true for errors that are worth retrying with backoff.
 * Auth, NotFound, Forbidden, and Validation errors are deterministic failures
 * — retrying them immediately won't help.
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof ServerError) return true;
  // Never retry auth / client errors
  return false;
}

// ── Classify HTTP status → typed error ───────────────────────────────────────

function classifyHttpError(status: number, message: string, details: unknown): ApiError {
  if (status === 401) return new AuthError(message, details);
  if (status === 403) return new ForbiddenError(message, details);
  if (status === 404) return new NotFoundError(message, details);
  if (status === 400 || status === 422) return new ValidationError(message, details);
  if (status >= 500) return new ServerError(message, status, details);
  return new ApiError(message, status, details);
}

// ── Session expiry broadcast ──────────────────────────────────────────────────

let _sessionExpiredBroadcast = false;

/**
 * Dispatches a custom DOM event so any listener (AuthProvider, modal, etc.)
 * can react to a fully-expired session without needing prop drilling.
 * Debounced so it fires at most once per page load.
 */
function broadcastSessionExpired() {
  if (typeof window === "undefined" || _sessionExpiredBroadcast) return;
  _sessionExpiredBroadcast = true;
  window.dispatchEvent(new CustomEvent("session:expired"));
  // Reset flag after a short delay so a sign-in → sign-out cycle works
  setTimeout(() => { _sessionExpiredBroadcast = false; }, 5_000);
}

// ── Core request function ─────────────────────────────────────────────────────

type ApiOptions = {
  /** Timeout in milliseconds. Default: 30 000 ms. */
  timeoutMs?: number;
  /** Whether to attempt a token refresh on 401. Default: true. */
  retryOnUnauthorized?: boolean;
};

const BASE_URL = "/api/proxy";

/**
 * Makes an authenticated request through the Next.js BFF proxy.
 *
 * - Automatically attaches HttpOnly cookie auth via the proxy layer.
 * - On 401, attempts one token refresh then retries the original request.
 * - Times out after `timeoutMs` milliseconds (default 30s).
 * - Throws typed ApiError subclasses so callers can discriminate errors.
 */
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? 30_000;
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort("timeout"), timeoutMs);

  async function doFetch(url: string): Promise<Response> {
    try {
      return await fetch(url, { ...init, headers, signal: controller.signal });
    } catch (err: unknown) {
      if (
        err instanceof DOMException && err.name === "AbortError" ||
        (typeof err === "string" && err === "timeout")
      ) {
        throw new TimeoutError();
      }
      // Any other fetch error → offline / DNS failure
      throw new NetworkError(err);
    }
  }

  async function parseErrorBody(response: Response): Promise<{ message: string; details: unknown }> {
    try {
      const body = await response.json();
      return { message: body?.message ?? "Request failed", details: body };
    } catch {
      return { message: "Request failed", details: null };
    }
  }

  try {
    let response = await doFetch(`${BASE_URL}${path}`);

    // ── 401 → try refresh → retry ───────────────────────────────────────────
    if (response.status === 401 && retryOnUnauthorized) {
      let refreshOk = false;
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          signal: controller.signal,
        });
        refreshOk = refreshRes.ok;
      } catch {
        // Refresh fetch itself failed (network/timeout)
      }

      if (refreshOk) {
        // Retry the original request with the fresh cookie
        response = await doFetch(`${BASE_URL}${path}`);
      } else {
        // Refresh failed — session is truly over
        broadcastSessionExpired();
        throw new AuthError();
      }
    }

    // ── Non-OK response → classify and throw ────────────────────────────────
    if (!response.ok) {
      const { message, details } = await parseErrorBody(response);
      throw classifyHttpError(response.status, message, details);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timerId);
  }
}

// ── Human-readable error message helper ──────────────────────────────────────

/**
 * Extracts a user-facing message from any thrown value.
 * Safe to pass to `toast.error(getErrorMessage(error))`.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "An unexpected error occurred. Please try again.";
}
