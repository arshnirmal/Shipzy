import type { AuthUser } from "@/types/auth";

const USER_KEY = "shipzy_business_user";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredUser(): AuthUser | null {
  if (!isBrowser()) return null;

  const rawUser = window.localStorage.getItem(USER_KEY);
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as AuthUser;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  if (!isBrowser()) return;

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser() {
  if (!isBrowser()) return;

  window.localStorage.removeItem(USER_KEY);
}
