import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getToken, isSessionExpired } from '../lib/auth';
import { logout as revokeTokenOnServer } from '../lib/api';

/** No activity for this long -> auto logout. */
const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

/** How often to check whether the session's clock has run out. */
const EXPIRY_CHECK_INTERVAL_MS = 30 * 1000;

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'] as const;

/**
 * Mounted once by App.tsx's ProtectedRoute, so it covers every
 * authenticated page without each dashboard needing its own copy.
 * Logs the user out (server-side revoke + local clear + redirect) when
 * either the idle timer or the session's expiry is reached, and tells
 * the login page why via a `reason` query param.
 */
export function useAutoLogout(): void {
  const navigate = useNavigate();
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function forceLogout(reason: 'idle' | 'expired') {
      if (!getToken()) return; // already logged out, nothing to do
      try {
        await revokeTokenOnServer();
      } catch {
        // Best effort - proceed with local logout either way.
      } finally {
        clearSession();
        navigate(`/login?reason=${reason}`, { replace: true });
      }
    }

    function resetIdleTimer() {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => forceLogout('idle'), IDLE_TIMEOUT_MS);
    }

    // `capture: true` is required for 'scroll': scroll events don't bubble,
    // so a listener on `window` in the bubble phase never fires for the
    // scrollable `overflow-y-auto` panels every dashboard uses — someone
    // actively scrolling a request list would still get idle-logged-out.
    // Capture-phase listeners see the event regardless of where it fires.
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { capture: true, passive: true }));
    resetIdleTimer();

    const expiryInterval = setInterval(() => {
      if (isSessionExpired()) forceLogout('expired');
    }, EXPIRY_CHECK_INTERVAL_MS);

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      clearInterval(expiryInterval);
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, resetIdleTimer, { capture: true }));
    };
  }, [navigate]);
}
