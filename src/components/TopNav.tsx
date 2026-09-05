import { useNavigate } from 'react-router-dom';
import type { AuthUser } from '../types';
import { clearSession } from '../lib/auth';

/**
 * components/TopNav.tsx
 * Used by: pages/RetailerDashboard, pages/DispatcherDashboard, pages/RiderApp
 */
export function TopNav({ user }: { user: AuthUser }) {
  const navigate = useNavigate();

  const roleLabel: Record<AuthUser['role'], string> = {
    retailer: 'Retailer Portal',
    dispatcher: 'Dispatcher Console',
    rider: 'Rider App',
  };

  function handleLogout() {
    clearSession();
    navigate('/login');
  }

  return (
    <header className="border-b border-ink/10 bg-white">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <div className="font-display text-xl font-semibold text-forest">
            Fikisha<span className="text-amber italic font-medium">.</span>
          </div>
          <div className="text-xs text-ink/50 uppercase tracking-wide">{roleLabel[user.role]}</div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink/70">{user.name}</span>
          <button onClick={handleLogout} className="text-sm text-ink/50 hover:text-rust transition-colors">
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}
