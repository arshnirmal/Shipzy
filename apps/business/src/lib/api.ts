import {
  clearStoredTokens,
  getStoredTokens,
  setStoredTokens,
} from "@/lib/auth";

type ApiOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken?: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1";

export class ApiError extends Error {
  statusCode: number;
  details: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const tokens = getStoredTokens();
  if (!tokens?.refreshToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken: tokens.refreshToken }),
    });

    if (!response.ok) {
      clearStoredTokens();
      return null;
    }

    const payload = (await response.json()) as {
      data?: RefreshResponse;
      success?: boolean;
    };

    if (!payload.success || !payload.data?.accessToken) {
      clearStoredTokens();
      return null;
    }

    setStoredTokens({
      accessToken: payload.data.accessToken,
      refreshToken: payload.data.refreshToken ?? tokens.refreshToken,
    });

    return payload.data.accessToken;
  } catch {
    clearStoredTokens();
    return null;
  }
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const requiresAuth = options.auth ?? true;
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (requiresAuth) {
    const token = getStoredTokens()?.accessToken;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && requiresAuth && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken();

    if (refreshedToken) {
      headers.set("Authorization", `Bearer ${refreshedToken}`);
      const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
        ...init,
        headers,
      });

      if (!retryResponse.ok) {
        const errorBody = await retryResponse
          .json()
          .catch(() => ({ message: "Request failed" }));
        throw new ApiError(
          errorBody.message ?? "Request failed",
          retryResponse.status,
          errorBody,
        );
      }

      return (await retryResponse.json()) as T;
    }
  }

  if (!response.ok) {
    const errorBody = await response
      .json()
      .catch(() => ({ message: "Request failed" }));

    throw new ApiError(
      errorBody.message ?? "Request failed",
      response.status,
      errorBody,
    );
  }

  return (await response.json()) as T;
}
