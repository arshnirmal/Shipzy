import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ action: string }> },
) {
  const { action } = await params;
  const cookieStore = await cookies();

  try {
    if (action === "logout") {
      cookieStore.delete("accessToken");
      cookieStore.delete("refreshToken");
      return NextResponse.json({ success: true, message: "Logged out" });
    }

    if (action === "refresh") {
      const refreshToken = cookieStore.get("refreshToken")?.value;

      if (!refreshToken) {
        return NextResponse.json(
          { success: false, message: "No refresh token" },
          { status: 401 },
        );
      }

      const backendRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await backendRes.json();

      if (!backendRes.ok || !data.success) {
        cookieStore.delete("accessToken");
        cookieStore.delete("refreshToken");
        return NextResponse.json(data, { status: backendRes.status || 401 });
      }

      const newAccessToken = data.data.accessToken;
      const newRefreshToken = data.data.refreshToken || refreshToken;

      const secure = process.env.NODE_ENV === "production";
      cookieStore.set({
        name: "accessToken",
        value: newAccessToken,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      cookieStore.set({
        name: "refreshToken",
        value: newRefreshToken,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      return NextResponse.json({ success: true, data: { success: true } });
    }

    if (action === "login" || action === "register") {
      const body = await request.json();
      const endpoint =
        action === "login" ? "/auth/login" : "/auth/register/business";

      const backendRes = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await backendRes.json();

      if (!backendRes.ok || !data.success) {
        return NextResponse.json(data, { status: backendRes.status });
      }

      const { tokens } = data.data.auth;

      const secure = process.env.NODE_ENV === "production";
      cookieStore.set({
        name: "accessToken",
        value: tokens.accessToken,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60,
      });

      cookieStore.set({
        name: "refreshToken",
        value: tokens.refreshToken,
        httpOnly: true,
        secure,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });

      // Return the response without tokens for security
      return NextResponse.json({
        success: true,
        data: {
          actor: data.data.actor,
          // Omit auth.tokens to prevent client access
          auth: { ...data.data.auth, tokens: undefined },
        },
      });
    }

    return NextResponse.json(
      { success: false, message: "Invalid action" },
      { status: 404 },
    );
  } catch (error) {
    console.error("Auth API Error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
