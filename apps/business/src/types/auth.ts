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

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  businessName: string;
  gstNumber?: string;
  monthlyVolume?: "0-100" | "100-500" | "500-2000" | "2000+";
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
