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

import { apiRequest } from "@/lib/api";
import {
  clearStoredTokens,
  clearStoredUser,
  getStoredTokens,
  getStoredUser,
  setStoredTokens,
  setStoredUser,
} from "@/lib/auth";
import type {
  ApiSuccess,
  AuthResponseData,
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
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const tokens = getStoredTokens();
    const storedUser = getStoredUser();
    setUser(tokens && storedUser ? storedUser : null);
    setIsLoading(false);
  }, []);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const response = await apiRequest<ApiSuccess<AuthResponseData>>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          credentials: {
            email: payload.email,
            password: payload.password,
          },
        }),
      },
      { auth: false },
    );

    const { tokens } = response.data.auth;
    setStoredTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    setStoredUser(response.data.actor.user);
    setUser(response.data.actor.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRequest<ApiSuccess<AuthResponseData>>(
      "/auth/register/business",
      {
        method: "POST",
        body: JSON.stringify({
          identity: {
            fullName: payload.fullName,
            phoneNumber: payload.phone,
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
      },
      { auth: false },
    );

    const { tokens } = response.data.auth;
    setStoredTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    setStoredUser(response.data.actor.user);
    setUser(response.data.actor.user);
  }, []);

  const signOut = useCallback(() => {
    clearStoredTokens();
    clearStoredUser();
    setUser(null);
  }, []);

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
