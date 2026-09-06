import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  open: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Used by every authenticated page's logout button (RetailerDashboard,
 * DispatcherDashboard, RiderApp). Kept as one shared component so the
 * confirmation flow stays consistent instead of each page rolling its own.
 */
export function LogoutConfirmModal({ open, loading = false, onCancel, onConfirm }: LogoutConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={loading ? undefined : onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center mb-5">
          <LogOut size={22} />
        </div>

        <h3 id="logout-modal-title" className="text-lg font-black text-slate-900 mb-2">
          Log out?
        </h3>
        <p className="text-sm text-slate-400 font-medium mb-8 leading-relaxed">
          You'll need to sign in again to access your dashboard.
        </p>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wide text-slate-500 bg-slate-50 hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-wide text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
          >
            {loading ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </div>
    </div>
  );
}
