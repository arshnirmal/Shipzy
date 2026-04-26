import { NextRequest, NextResponse } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

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

  // Clone headers from the incoming request
  const headers = new Headers(request.headers);
  
  // Attach the secure token for backend authentication
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  
  // Clean up headers that should not be forwarded or will be set by fetch
  headers.delete("host");
  headers.delete("connection");
  // Keep Content-Type, Accept, etc.

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers: headers,
      // @ts-ignore - duplex is required when body is a stream in some environments
      duplex: "half",
    };

    // Forward the request body for methods that support it
    if (request.method !== "GET" && request.method !== "HEAD") {
      // In the App Router, request.body is a ReadableStream
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // Return the backend's response directly, including its body stream and headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
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
