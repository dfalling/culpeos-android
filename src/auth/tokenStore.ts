import {makeVar} from '@apollo/client';
import {useReactiveVar} from '@apollo/client/react';
import EncryptedStorage from 'react-native-encrypted-storage';

// Persistent auth store backed by EncryptedSharedPreferences (Android) /
// Keychain (iOS) via react-native-encrypted-storage. The reactive var
// drives UI; the storage layer is the source of truth across app launches.

const STORAGE_KEY = 'culpeos.auth';

// Refresh the access token this many ms before its expiry to avoid the
// round-trip on the next request. Must be < access-token lifetime (15min).
export const REFRESH_LEAD_MS = 60_000;

export type AuthUser = {
  id: string;
  email: string;
  locale?: string | null;
};

export type AuthState = {
  accessToken: string;
  refreshToken: string;
  /** Absolute access-token expiration, ms since epoch. */
  expiresAtMs: number;
  user: AuthUser;
};

const authVar = makeVar<AuthState | null>(null);
const hydratedVar = makeVar<boolean>(false);

function persist(state: AuthState): void {
  EncryptedStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(err => {
    console.warn('[auth] failed to persist token', err);
  });
}

function remove(): void {
  EncryptedStorage.removeItem(STORAGE_KEY).catch(err => {
    if (__DEV__) console.debug('[auth] removeItem:', err);
  });
}

export const tokenStore = {
  get(): AuthState | null {
    return authVar();
  },
  set(state: AuthState): void {
    authVar(state);
    persist(state);
  },
  clear(): void {
    authVar(null);
    remove();
  },
  /** True if the access token is missing or within the proactive-refresh window. */
  isAccessTokenExpiringSoon(now: number = Date.now()): boolean {
    const state = authVar();
    if (!state) return false;
    return state.expiresAtMs - now <= REFRESH_LEAD_MS;
  },
  /**
   * Load any persisted tokens into memory. Call once at app startup before
   * deciding whether to render the login screen.
   */
  async hydrate(): Promise<void> {
    try {
      const raw = await EncryptedStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AuthState>;
        if (
          parsed?.accessToken &&
          parsed?.refreshToken &&
          typeof parsed.expiresAtMs === 'number' &&
          parsed.user?.id
        ) {
          authVar(parsed as AuthState);
        }
      }
    } catch (err) {
      console.warn('[auth] failed to hydrate token', err);
    } finally {
      hydratedVar(true);
    }
  },
};

export function useAuth(): AuthState | null {
  return useReactiveVar(authVar);
}

export function useAuthHydrated(): boolean {
  return useReactiveVar(hydratedVar);
}
