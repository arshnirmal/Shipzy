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
import { useQueryClient } from "@tanstack/react-query";

import {
  clearStoredUser,
  getStoredUser,
  onSessionExpired,
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

type AuthApiResponse = {
  success?: boolean;
  message?: string;
  data?: {
    actor?: {
      user?: AuthUser;
    };
  };
};

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Initialize with null, hydrate on client
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      const storedUser = getStoredUser();
      if (storedUser) {
        if (!isMounted) return;
        setUser(storedUser);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/refresh", { method: "POST" });
        const data = (await response.json().catch(() => null)) as AuthApiResponse | null;

        if (response.ok && data?.success && data.data?.actor?.user) {
          setStoredUser(data.data.actor.user);
          if (!isMounted) return;
          setUser(data.data.actor.user);
        } else {
          clearStoredUser();
          queryClient.clear();
        }
      } catch {
        clearStoredUser();
        queryClient.clear();
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    setIsHydrated(true);
    void hydrateSession();

    return () => {
      isMounted = false;
    };
  }, [queryClient]);

  useEffect(() => {
    return onSessionExpired(() => {
      clearStoredUser();
      queryClient.clear();
      setUser(null);
    });
  }, [queryClient]);

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
    queryClient.clear();
    setUser(data.data.actor.user);
  }, [queryClient]);

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
    queryClient.clear();
    setUser(data.data.actor.user);
  }, [queryClient]);

  const signOut = useCallback(async () => {
    // Call the logout endpoint to clear HttpOnly cookies
    await fetch("/api/auth/logout", { method: "POST" });
    
    clearStoredUser();
    queryClient.clear();
    setUser(null);
    router.push("/?auth=login");
  }, [queryClient, router]);

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

  // Prevent rendering children during SSR mismatch frame
  if (!isHydrated) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { getSafeNextPath };
