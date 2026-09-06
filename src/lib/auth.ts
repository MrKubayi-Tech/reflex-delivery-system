import type { AuthUser } from '../types';

const TOKEN_KEY = 'fikisha_token';
const USER_KEY = 'fikisha_user';
const EXPIRES_KEY = 'fikisha_expires_at';

/**
 * Mirrors the backend's Auth::TOKEN_TTL_SECONDS (see
 * reflex-delivery-system-api/src/classes/Auth.php). This is only used so
 * the client can proactively log out an idle tab instead of waiting for
 * the next API call to come back 401 - the server is still the source of
 * truth for whether a token is actually valid.
 */
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

export function saveSession(token: string, user: AuthUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(EXPIRES_KEY, String(Date.now() + SESSION_TTL_MS));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(EXPIRES_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

/**
 * True once the client-side session clock has run out. Sessions saved
 * before this field existed have no expiry recorded and are treated as
 * not-yet-expired here; the server's own expiry check is what actually
 * protects those.
 */
export function isSessionExpired(): boolean {
  const raw = localStorage.getItem(EXPIRES_KEY);
  if (!raw) return false;
  const expiresAt = Number(raw);
  if (Number.isNaN(expiresAt)) return false;
  return Date.now() > expiresAt;
}
