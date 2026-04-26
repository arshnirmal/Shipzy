export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export const getAccessToken = (responseBody: any): string =>
  responseBody.data.auth.tokens.accessToken;

export const getRefreshToken = (responseBody: any): string =>
  responseBody.data.auth.tokens.refreshToken;

export const getTokens = (responseBody: any): AuthTokens =>
  responseBody.data.auth.tokens as AuthTokens;
