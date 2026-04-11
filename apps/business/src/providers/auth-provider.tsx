"use client";

import {
  createContext,
  useCallback,
  useContext,
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
  const [user, setUser] = useState<AuthUser | null>(() => {
    const tokens = getStoredTokens();
    const storedUser = getStoredUser();

    return tokens && storedUser ? storedUser : null;
  });
  const [isLoading] = useState(false);

  const signIn = useCallback(async (payload: LoginPayload) => {
    const response = await apiRequest<ApiSuccess<AuthResponseData>>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          role: "client",
        }),
      },
      { auth: false },
    );

    setStoredTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    setStoredUser(response.data.user);
    setUser(response.data.user);
  }, []);

  const signUp = useCallback(async (payload: RegisterPayload) => {
    const response = await apiRequest<ApiSuccess<AuthResponseData>>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          name: payload.businessName,
          email: payload.email,
          password: payload.password,
          gstNumber: payload.gstNumber,
          role: "client",
        }),
      },
      { auth: false },
    );

    setStoredTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    });
    setStoredUser(response.data.user);
    setUser(response.data.user);
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
