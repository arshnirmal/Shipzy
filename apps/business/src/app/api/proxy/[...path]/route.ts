import { NextRequest, NextResponse } from "next/server";

// Prefer API_URL (server-only) so the backend URL is never embedded in client bundles.
// Fall back to NEXT_PUBLIC_API_URL for backward compat with existing Netlify env vars.
const API_BASE_URL =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000/api/v1";

// RFC 7230 §6.1 — hop-by-hop headers must not be forwarded by proxies.
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
]);

/**
 * BFF proxy: forwards /api/proxy/* to the backend, injecting the HttpOnly
 * accessToken cookie as an Authorization header. Hop-by-hop headers are
 * stripped from both the forwarded request and the upstream response so that
 * Netlify's CDN layer does not misinterpret them.
 */
async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const queryString = request.nextUrl.search;
  const targetUrl = `${API_BASE_URL}/${path.join("/")}${queryString}`;

  const accessToken = request.cookies.get("accessToken")?.value;

  // Build forwarded request headers.
  // Exclude hop-by-hop headers, the host header (rewritten by fetch), and
  // the cookie header (auth is carried via the Authorization header instead).
  const forwardHeaders = new Headers();
  for (const [key, value] of request.headers.entries()) {
    const lower = key.toLowerCase();
    if (HOP_BY_HOP.has(lower) || lower === "host" || lower === "cookie") continue;
    forwardHeaders.set(key, value);
  }

  if (accessToken) {
    forwardHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: forwardHeaders,
    ...(hasBody && { body: request.body }),
    // @ts-ignore — duplex is required for streaming request bodies in Node.js fetch
    ...(hasBody && { duplex: "half" }),
  };

  try {
    const upstream = await fetch(targetUrl, fetchOptions);

    // Strip hop-by-hop headers from the upstream response before returning.
    // Forwarding them to Netlify's openresty layer causes 502s.
    const responseHeaders = new Headers();
    for (const [key, value] of upstream.headers.entries()) {
      if (!HOP_BY_HOP.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("[BFF Proxy Error]:", error);
    return NextResponse.json(
      { success: false, message: "Failed to connect to the backend service" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
