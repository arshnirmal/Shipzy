/**
 * Centralized Storage Utility for Shipzy Business
 * Ensures strict typing, namespacing to prevent collisions, and safe parsing.
 */

const NAMESPACE = "shipzy_biz_";

export const StorageKeys = {
  USER_PROFILE: "user_profile",
  THEME_PREFERENCE: "theme_preference",
  DRAFTS: "drafts",
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Creates a type-safe storage helper around localStorage or sessionStorage.
 */
function createStorageHelper(storageType: "localStorage" | "sessionStorage") {
  const getStorage = () => (isBrowser() ? window[storageType] : null);

  return {
    get: <T>(key: StorageKey): T | null => {
      const storage = getStorage();
      if (!storage) return null;

      const rawValue = storage.getItem(`${NAMESPACE}${key}`);
      if (!rawValue) return null;

      try {
        return JSON.parse(rawValue) as T;
      } catch {
        // If JSON parsing fails, the data is corrupted. Clean it up.
        storage.removeItem(`${NAMESPACE}${key}`);
        return null;
      }
    },

    set: <T>(key: StorageKey, value: T): void => {
      const storage = getStorage();
      if (!storage) return;

      try {
        storage.setItem(`${NAMESPACE}${key}`, JSON.stringify(value));
      } catch (err) {
        console.error(`Failed to write to ${storageType}:`, err);
      }
    },

    remove: (key: StorageKey): void => {
      const storage = getStorage();
      if (!storage) return;

      storage.removeItem(`${NAMESPACE}${key}`);
    },

    clearNamespace: (): void => {
      const storage = getStorage();
      if (!storage) return;

      const keysToRemove: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key?.startsWith(NAMESPACE)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => storage.removeItem(key));
    },
  };
}

export const localStore = createStorageHelper("localStorage");
export const sessionStore = createStorageHelper("sessionStorage");
