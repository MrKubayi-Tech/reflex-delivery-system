import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession } from '../lib/auth';
import { logout as revokeTokenOnServer } from '../lib/api';

/**
 * Drives the "click Logout -> confirm -> actually log out" flow used by
 * every dashboard's logout button. Centralized so the button click always:
 *  1. asks for confirmation,
 *  2. tells the server to revoke the token (POST /api/auth/logout),
 *  3. clears the local session and redirects to /login,
 * regardless of which page it was triggered from.
 */
export function useLogoutFlow() {
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirmLogout() {
    setLoading(true);
    try {
      await revokeTokenOnServer();
    } catch {
      // Best effort - the token may already be expired/invalid, or the
      // network may be down. Either way the user still gets logged out
      // locally below; we never want a failed API call to trap someone
      // in a "logged in" UI they can't get out of.
    } finally {
      clearSession();
      setLoading(false);
      setConfirmOpen(false);
      navigate('/login', { replace: true });
    }
  }

  return {
    confirmOpen,
    loading,
    requestLogout: () => setConfirmOpen(true),
    cancelLogout: () => setConfirmOpen(false),
    confirmLogout,
  };
}
