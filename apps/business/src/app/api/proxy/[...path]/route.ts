import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

/** Hop-by-hop / browser headers that must not be forwarded to the origin or back to the client. */
const REQUEST_HEADER_BLOCKLIST = new Set(
  [
    "host",
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
    "cookie",
    "content-length",
    "sec-fetch-site",
    "sec-fetch-mode",
    "sec-fetch-dest",
    "sec-fetch-user",
    "sec-ch-ua",
    "sec-ch-ua-mobile",
    "sec-ch-ua-platform",
    "priority",
  ].map((h) => h.toLowerCase()),
);

const RESPONSE_HEADER_BLOCKLIST = new Set(
  [
    "connection",
    "keep-alive",
    "proxy-connection",
    "transfer-encoding",
    "upgrade",
    // Let Next compute length / chunking for the re-streamed body
    "content-length",
  ].map((h) => h.toLowerCase()),
);

function buildUpstreamHeaders(incoming: Headers, accessToken: string | undefined): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (!REQUEST_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      out.append(key, value);
    }
  });
  if (accessToken) {
    out.set("Authorization", `Bearer ${accessToken}`);
  }
  return out;
}

function sanitizeResponseHeaders(upstream: Headers): Headers {
  const out = new Headers();
  upstream.forEach((value, key) => {
    if (!RESPONSE_HEADER_BLOCKLIST.has(key.toLowerCase())) {
      out.append(key, value);
    }
  });
  return out;
}

/**
 * Robust API Proxy Route Handler (BFF Pattern)
 * 
 * This handler catches all requests to /api/proxy/* and forwards them to the 
 * external backend API. It automatically attaches the secure HttpOnly 
 * accessToken from cookies to the Authorization header.
 * 
 * Using a Route Handler instead of Middleware for proxying is the recommended 
 * approach in Next.js for cross-origin requests, as it avoids Edge Runtime 
 * limitations and handles streaming/large payloads more reliably.
 */
async function handleProxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const queryString = request.nextUrl.search;
  const targetUrl = `${API_BASE_URL}/${path.join("/")}${queryString}`;

  const accessToken = request.cookies.get("accessToken")?.value;
  const headers = buildUpstreamHeaders(request.headers, accessToken);

  try {
    const hasBody = request.method !== "GET" && request.method !== "HEAD";
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };

    if (hasBody) {
      Object.assign(fetchOptions, {
        body: request.body,
        // Required when forwarding a stream body (Node fetch / undici)
        duplex: "half" as const,
      });
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Strip hop-by-hop headers — forwarding them with a re-streamed body often
    // causes HTML 502s from edge proxies (e.g. OpenResty) even when origin returned 200.
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: sanitizeResponseHeaders(response.headers),
    });
  } catch (error) {
    console.error("[BFF Proxy Error]:", error);
    return NextResponse.json(
      { message: "Failed to connect to the backend service" },
      { status: 502 }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
