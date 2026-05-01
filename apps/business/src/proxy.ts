import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/orders",
  "/accounting",
  "/analytics",
  "/team",
  "/settings",
  "/drafts",
  "/templates",
  "/notifications",
];

function buildAuthUrl(request: NextRequest, auth: "login" | "register") {
  const url = new URL("/", request.url);
  url.searchParams.set("auth", auth);
  if (request.nextUrl.pathname !== "/") {
    url.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
  }
  return url;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const hasSessionCookie = Boolean(accessToken || refreshToken);
  const authParam = request.nextUrl.searchParams.get("auth");

  // Authenticated users should land in the product, not the marketing/auth flow.
  if (
    hasSessionCookie &&
    (pathname === "/" ||
      pathname === "/login" ||
      pathname === "/register" ||
      authParam === "login" ||
      authParam === "register")
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 1. Route Protection
  const isProtectedRoute = protectedRoutes.some((route) => 
    pathname.startsWith(route) || pathname === route
  );

  if (isProtectedRoute && !accessToken) {
    // Check if refresh token exists to avoid immediate redirect if they can still refresh
    if (!refreshToken) {
      return NextResponse.redirect(buildAuthUrl(request, "login"));
    }
  }

  // Backward-compatible redirects for older hard-coded auth URLs.
  if (pathname === "/login" && !accessToken) {
    return NextResponse.redirect(buildAuthUrl(request, "login"));
  }

  if (pathname === "/register" && !accessToken) {
    return NextResponse.redirect(buildAuthUrl(request, "register"));
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
