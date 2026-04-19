import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/orders",
  "/accounting",
  "/analytics",
  "/team",
  "/settings",
  "/drafts",
  "/templates"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;

  // 1. Route Protection
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route) || pathname === route
  );

  if (isProtectedRoute && !accessToken) {
    // Check if refresh token exists to avoid immediate redirect if they can still refresh
    const refreshToken = request.cookies.get("refreshToken")?.value;
    if (!refreshToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated users away from /login or /register
  if ((pathname === "/login" || pathname === "/register") && accessToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, fonts, etc.
     */
    // String.raw breaks Turbopack static analysis for proxy `config.matcher` (Next.js 16).
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
