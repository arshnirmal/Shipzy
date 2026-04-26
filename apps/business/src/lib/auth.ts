import type { AuthUser } from "@/types/auth";
import { localStore, StorageKeys } from "@/lib/storage";

export function isBrowser() {
  return typeof window !== "undefined";
}

export function getStoredUser(): AuthUser | null {
  return localStore.get<AuthUser>(StorageKeys.USER_PROFILE);
}

export function setStoredUser(user: AuthUser) {
  localStore.set(StorageKeys.USER_PROFILE, user);
}

export function clearStoredUser() {
  localStore.remove(StorageKeys.USER_PROFILE);
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
