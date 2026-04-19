"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  clearStoredUser,
  getStoredUser,
  setStoredUser,
} from "@/lib/auth";
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (payload: LoginPayload) => Promise<void>;
  signUp: (payload: RegisterPayload) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only rely on stored user. Tokens are securely managed by Next.js HttpOnly cookies.
    const storedUser = getStoredUser();
    setUser(storedUser || null);
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credentials: payload }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to sign in");
    }

    setStoredUser(data.data.actor.user);
    setUser(data.data.actor.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: {
          fullName: payload.fullName,
          phoneNumber: payload.phoneNumber,
        },
        credentials: {
          email: payload.email,
          password: payload.password,
        },
        business: {
          businessName: payload.businessName,
          gstNumber: payload.gstNumber,
          monthlyVolume: payload.monthlyVolume,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Failed to sign up");
    }

    setStoredUser(data.data.actor.user);
    setUser(data.data.actor.user);
  }, []);

  const signOut = useCallback(async () => {
    // Call the logout endpoint to clear HttpOnly cookies
    await fetch("/api/auth/logout", { method: "POST" });
    
    clearStoredUser();
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
