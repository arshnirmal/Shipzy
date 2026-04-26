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

/**
 * Register a one-time listener for the "session:expired" custom event that
 * is dispatched by apiRequest() after a failed token refresh.
 * Returns a cleanup function — call it in useEffect teardown.
 */
export function onSessionExpired(handler: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("session:expired", handler);
  return () => window.removeEventListener("session:expired", handler);
}
