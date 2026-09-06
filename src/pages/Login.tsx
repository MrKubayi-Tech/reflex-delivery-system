import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  Smartphone, 
  Lock, 
  ChevronRight,
  ShieldCheck,
  UserCircle,
  Clock
} from 'lucide-react';

import type { Role } from '../types';
import { login, ApiError } from '../lib/api';
import { saveSession } from '../lib/auth';
import { validatePhone, validateRequired } from '../lib/validation';

// --- Visual Styles ---

const ROLE_LABELS: Record<Role, string> = {
  retailer: 'Retailer',
  dispatcher: 'Dispatcher',
  rider: 'Rider',
};

const ROLE_ORDER: Role[] = ['retailer', 'dispatcher', 'rider'];

const DEMO_ACCOUNTS: Record<Role, string> = {
  retailer: '+254700000001',
  dispatcher: '+254700000002',
  rider: '+254700000003',
};

const AUTO_LOGOUT_MESSAGES: Record<string, string> = {
  idle: "You were signed out after a period of inactivity.",
  expired: "Your session expired. Please sign in again.",
};

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const autoLogoutMessage = AUTO_LOGOUT_MESSAGES[searchParams.get('reason') ?? ''];
  const [role, setRole] = useState<Role>('retailer');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const canSubmit = phone.trim().length > 0 && password.length > 0 && !loading;

  /** Inline pre-check, mirrors the backend's required-field rules (login.php). */
  function validate(): boolean {
    const errors: Record<string, string> = {};
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
    const passwordError = validateRequired(password, 'Password');
    if (passwordError) errors.password = passwordError;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  /**
   * A successful login issues a real server-side token before the
   * frontend even knows which role the account actually has. If that
   * role doesn't match the tab the person picked, we must not leave
   * that token valid and unused on the server — revoke it immediately
   * rather than silently discarding it client-side.
   */
  async function revokeOrphanedToken(token: string) {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // Best effort — the token will still expire on its own (24h TTL).
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);
    try {
      const { token, user } = await login(phone.trim(), password);
      if (user.role !== role) {
        await revokeOrphanedToken(token);
        setError(`Access denied. This account is registered as a ${ROLE_LABELS[user.role]}. Switch tabs above and try again.`);
        setLoading(false);
        return;
      }
      saveSession(token, user);
      const landing: Record<Role, string> = { 
        retailer: '/retailer', 
        dispatcher: '/dispatcher', 
        rider: '/rider' 
      };
      navigate(landing[user.role]);
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFieldErrors(err.fieldErrors);
      } else {
        setError(err instanceof ApiError ? err.message : 'Invalid phone number or password.');
      }
    } finally {
      setLoading(false);
    }
  }

  function fillDemoAccount(demoRole: Role) {
    setRole(demoRole);
    setPhone(DEMO_ACCOUNTS[demoRole]);
    setPassword('password123');
    setError(null);
    setFieldErrors({});
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex flex-col md:flex-row font-sans">
      
      {/* Branding Side - Hidden on Mobile */}
      <div className="hidden md:flex w-1/2 bg-[#0047BB] p-16 flex-col justify-between text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-[#0047BB] font-black italic text-xl">R</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Reflex</h1>
        </div>

        <div className="max-w-md">
          <h2 className="text-5xl font-black leading-tight mb-6">
            The backbone of your logistics.
          </h2>
          <p className="text-white/60 text-lg leading-relaxed">
            Manage retailers, dispatch riders, and track deliveries in real-time with the industry's most reliable platform.
          </p>
        </div>

        <div className="flex items-center gap-8 opacity-50">
          <div className="flex flex-col">
            <span className="text-2xl font-black">99.9%</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Uptime</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-black">24/7</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">Dispatch Support</span>
          </div>
        </div>
      </div>

      {/* Login Side */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-md">
          <div className="md:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#0047BB] rounded flex items-center justify-center">
              <span className="text-white font-black italic">R</span>
            </div>
            <span className="font-black text-xl">Reflex</span>
          </div>

          <h3 className="text-3xl font-black text-slate-900 mb-2">Welcome Back</h3>
          <p className="text-slate-400 text-sm font-medium mb-10">Sign in to access your dashboard.</p>

          {autoLogoutMessage && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 items-center">
              <Clock size={18} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 font-bold leading-tight">{autoLogoutMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Industry Standard Segmented Control for Roles */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                Select Your Access Level
              </label>
              <div className="flex p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                {ROLE_ORDER.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-tighter transition-all ${
                      role === r 
                        ? 'bg-white shadow-sm text-[#0047BB] ring-1 ring-slate-100' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone Input */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                Phone Number
              </label>
              <div className="relative group">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047BB] transition-colors" size={18} />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: '' }); }}
                  onBlur={() => { const err = validatePhone(phone); setFieldErrors((f) => ({ ...f, phone: err ?? '' })); }}
                  placeholder="+254 700 000 000"
                  className={`w-full pl-12 pr-4 py-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all font-medium text-slate-900 ${
                    fieldErrors.phone ? 'border-red-200 focus:ring-red-100' : 'border-slate-100 focus:ring-[#0047BB]/10 focus:border-[#0047BB]'
                  }`}
                />
              </div>
              {fieldErrors.phone && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-1.5 ml-1">{fieldErrors.phone}</p>}
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between mb-2">
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Password
                </label>
                <Link to="/forgot" className="text-[10px] font-bold text-[#0047BB] uppercase tracking-widest hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0047BB] transition-colors" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' }); }}
                  placeholder="••••••••••••"
                  className={`w-full pl-12 pr-12 py-4 bg-slate-50 border rounded-xl outline-none focus:ring-2 transition-all font-medium text-slate-900 ${
                    fieldErrors.password ? 'border-red-200 focus:ring-red-100' : 'border-slate-100 focus:ring-[#0047BB]/10 focus:border-[#0047BB]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-[10px] font-bold text-red-500 uppercase tracking-tighter mt-1.5 ml-1">{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3 items-center">
                <ShieldCheck size={18} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600 font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full py-4 bg-[#0047BB] text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-[#0047BB]/30 hover:bg-[#0037a3] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? 'Authenticating...' : 'Sign In To Portal'}
              {!loading && <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>

          {/* Industry Standard Demo Accounts Styling */}
          <div className="mt-12">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-4 flex items-center gap-2">
              <span className="w-10 h-px bg-slate-100"></span>
              Or Quick Launch Demo
              <span className="w-10 h-px bg-slate-100"></span>
            </p>
            <div className="grid grid-cols-3 gap-3">
              {ROLE_ORDER.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => fillDemoAccount(r)}
                  className="flex flex-col items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl hover:border-[#0047BB] hover:bg-blue-50/30 transition-all group"
                >
                  <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-[#0047BB] group-hover:bg-white transition-colors">
                     <UserCircle size={18} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 group-hover:text-slate-900 uppercase tracking-tighter">
                    {ROLE_LABELS[r]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-slate-400 font-medium">
            New to the platform?{' '}
            <Link to="/register" className="text-[#0047BB] font-black hover:underline underline-offset-4">
              Apply for an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}