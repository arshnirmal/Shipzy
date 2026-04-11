export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthUser = {
  id?: string;
  email: string;
  businessName?: string;
  role?: "client" | "courier" | "business";
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
  businessName: string;
  email: string;
  password: string;
  gstNumber?: string;
};

export type AuthResponseData = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
