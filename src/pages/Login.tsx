import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login, ApiError } from '../lib/api';
import { saveSession } from '../lib/auth';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

/**
 * pages/Login.tsx
 * Depends on: lib/api.login, lib/auth.saveSession
 * Used by: App.tsx route "/login"
 */

const DEMO_ACCOUNTS = [
  { label: 'Retailer', phone: '+254700000001' },
  { label: 'Dispatcher', phone: '+254700000002' },
  { label: 'Rider (John Doe)', phone: '+254700000003' },
] as const;

export function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !loading;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    try {
      const { token, user } = await login(phone.trim(), password);
      saveSession(token, user);
      const landing: Record<typeof user.role, string> = {
        retailer: '/retailer',
        dispatcher: '/dispatcher',
        rider: '/rider',
      };
      navigate(landing[user.role]);
    } catch (err) {
      // Surfaces the real backend message — matters for account_locked
      // (423), which is a materially different situation from a plain
      // wrong password and shouldn't be masked by a generic string.
      setError(err instanceof ApiError ? err.message : 'Invalid phone or password.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(demoPhone: string) {
    setPhone(demoPhone);
    setPassword('password123');
    setError(null);
  }

  return (
    <div className="min-h-screen bg-forest flex items-center justify-center px-6">
      <Card className="w-full max-w-sm p-8 border-none">
        <div className="font-display text-3xl font-semibold text-forest mb-1">
          Fikisha<span className="text-amber italic font-medium">.</span>
        </div>
        <p className="text-sm text-ink/50 mb-8">Sign in to your portal.</p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="phone"
              className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5"
            >
              Phone number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+254700000001"
              aria-invalid={!!error}
              className="w-full border border-ink/15 px-3 py-2.5 text-sm focus:outline-none focus:border-forest transition-colors"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-invalid={!!error}
                className="w-full border border-ink/15 px-3 py-2.5 pr-10 text-sm focus:outline-none focus:border-forest transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/70 transition-colors"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-rust">
              {error}
            </p>
          )}

          <Button type="submit" disabled={!canSubmit} className="w-full">
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <svg
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
                </svg>
                Signing in…
              </span>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-ink/10">
          <p className="text-xs font-semibold text-ink/50 mb-2">
            Demo accounts (password: password123)
          </p>
          <div className="space-y-1">
            {DEMO_ACCOUNTS.map((acct) => (
              <button
                key={acct.phone}
                type="button"
                onClick={() => fillDemoAccount(acct.phone)}
                className="block w-full text-left text-xs text-ink/40 hover:text-forest transition-colors"
              >
                {acct.label} — {acct.phone}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink/50">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-forest font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}