type ApiOptions = {
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

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

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiOptions = {},
): Promise<T> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  // All requests go through the Next.js API proxy to automatically attach HttpOnly cookies
  const baseUrl = "/api/proxy";
  
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401 && retryOnUnauthorized) {
    // Attempt to refresh token via the Next.js BFF endpoint
    const refreshRes = await fetch("/api/auth/refresh", { method: "POST" });
    
    if (refreshRes.ok) {
      // Retry the original request; the proxy will use the new HttpOnly cookie automatically
      const retryResponse = await fetch(`${baseUrl}${path}`, {
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
