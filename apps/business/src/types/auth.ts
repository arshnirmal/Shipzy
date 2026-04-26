export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  userUuid: string;
  email: string;
  fullName: string;
  role: "client" | "courier" | "business" | "admin";
  phoneNumber?: string;
  profilePictureUrl?: string;
  businessName?: string;
  isVerified: boolean;
  isActive: boolean;
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
  timestamp: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

import type { MonthlyVolume } from "@/lib/validations/auth";

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  businessName: string;
  gstNumber?: string;
  monthlyVolume?: MonthlyVolume;
};

export type AuthResponseData = {
  actor: {
    user: AuthUser;
  };
  auth: {
    tokens: {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: "Bearer";
    };
    session: {
      method: "email" | "google" | "refresh";
      isNewUser?: boolean;
    };
  };
};
