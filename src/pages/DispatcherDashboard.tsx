import { useEffect, useState } from 'react';
import type { AuthUser, DeliveryRequest, Rider } from '../types';
import { assignRider, fetchAvailableRiders, fetchRequests, subscribeToRequests } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { PriorityBadge } from '../components/StatusBadge';

/**
 * pages/DispatcherDashboard.tsx
 * Depends on: lib/api (fetchRequests, fetchAvailableRiders, assignRider, subscribeToRequests)
 * Persona: Dispatcher (BRD §4) — sees open (unassigned) requests (FR-4),
 * assigns each to a rider (FR-5, FR-6). If a race loses (another
 * dispatcher assigned it first), the backend returns 409 — see the error
 * banner below, which is the NFR concurrency guarantee made visible.
 */
export function DispatcherDashboard({ user }: { user: AuthUser }) {
  const [pending, setPending] = useState<DeliveryRequest[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [assigningId, setAssigningId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const [reqs, availableRiders] = await Promise.all([fetchRequests('pending'), fetchAvailableRiders()]);
    setPending(reqs);
    setRiders(availableRiders);
  }

  useEffect(() => {
    refresh().catch(() => {});
    const unsubscribe = subscribeToRequests((all) => {
      setPending(all.filter((r) => r.current_status === 'pending'));
    }, 'pending');
    return unsubscribe;
  }, []);

  async function handleAssign(requestId: number, riderId: number) {
    setError(null);
    try {
      await assignRider(requestId, riderId);
      await refresh();
      setAssigningId(null);
    } catch (err) {
      // A 409 here means another dispatcher won the race — refresh so the
      // now-stale "pending" card disappears instead of staying clickable.
      setError((err as Error).message);
      refresh();
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav user={user} />

      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr,380px] gap-6">
        <div>
          <div className="flex items-baseline gap-2 mb-4">
            <h1 className="font-display text-2xl font-semibold text-ink">Open Requests</h1>
            <span className="text-sm text-ink/40">{pending.length} pending</span>
          </div>

          {error && <div className="mb-4 px-4 py-3 border border-rust/40 bg-rust/5 text-sm text-rust">{error}</div>}

          {pending.length === 0 ? (
            <Card className="p-6 text-sm text-ink/40">No pending requests right now.</Card>
          ) : (
            <div className="space-y-4">
              {pending.map((req) => (
                <Card key={req.delivery_request_id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs text-ink/40 mb-1 font-mono">{req.tracking_code}</div>
                      <h3 className="font-semibold text-ink">{req.item_description}</h3>
                      <div className="text-xs text-ink/40">{req.retailer_name}</div>
                    </div>
                    {req.priority && <PriorityBadge priority={req.priority} />}
                  </div>

                  <div className="text-sm text-ink/60 mb-3">→ {req.customer_address}</div>
                  {req.weight_kg != null && <div className="text-xs text-ink/40 mb-4">Weight: {req.weight_kg}kg</div>}

                  {assigningId === req.delivery_request_id ? (
                    <div className="border-t border-ink/10 pt-3 space-y-2">
                      {riders.length === 0 && <p className="text-xs text-ink/40">No riders available.</p>}
                      {riders.map((rider) => (
                        <button
                          key={rider.user_id}
                          onClick={() => handleAssign(req.delivery_request_id, rider.user_id)}
                          className="w-full flex items-center justify-between px-3 py-2 border border-ink/10 hover:border-forest text-left text-sm transition-colors"
                        >
                          <span>
                            {rider.full_name} · {rider.vehicle_type?.replace('_', ' ') ?? 'unknown vehicle'}
                          </span>
                          <span className="text-xs text-ink/40">{rider.capacity_pct ?? '—'}% capacity</span>
                        </button>
                      ))}
                      <button
                        onClick={() => setAssigningId(null)}
                        className="text-xs text-ink/40 hover:text-ink mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button onClick={() => setAssigningId(req.delivery_request_id)} className="w-full justify-center flex">
                      Assign Rider →
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Available Riders</h2>
          <Card className="divide-y divide-ink/5">
            {riders.length === 0 && <div className="p-4 text-sm text-ink/40">No riders available.</div>}
            {riders.map((rider) => (
              <div key={rider.user_id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage/40 text-forest-deep flex items-center justify-center text-xs font-semibold">
                    {rider.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-ink">{rider.full_name}</div>
                    <div className="text-xs text-ink/40 capitalize">{rider.vehicle_type?.replace('_', ' ') ?? '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-forest">
                    {rider.availability === 'idle' ? 'Available Now' : 'En Route'}
                  </div>
                  <div className="text-xs text-ink/40">{rider.capacity_pct ?? '—'}%</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </main>
    </div>
  );
}
