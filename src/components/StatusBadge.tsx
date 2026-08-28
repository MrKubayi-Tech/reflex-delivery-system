import type { DeliveryStatus, Priority } from '../types';

/**
 * components/StatusBadge.tsx
 *
 * Used by: pages/RetailerDashboard, pages/DispatcherDashboard, pages/RiderApp
 * Renders delivery status and priority as flat, bordered pills — no
 * gradients, one accent color per semantic meaning (amber = attention,
 * forest = settled/complete, sage = neutral/in progress).
 */

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  pending: 'bg-cream text-ink border-ink/20',
  assigned: 'bg-sage/30 text-forest-deep border-forest/20',
  picked_up: 'bg-amber/15 text-amber border-amber/40',
  delivered: 'bg-forest text-cream border-forest',
};

const STATUS_TEXT: Record<DeliveryStatus, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  picked_up: 'Picked Up',
  delivered: 'Delivered',
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border ${STATUS_STYLES[status]}`}
    >
      {STATUS_TEXT[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  if (priority === 'standard') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-ink/15 text-ink/60">
        Standard
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide border border-rust/40 bg-rust/10 text-rust">
      High Priority
    </span>
  );
}
