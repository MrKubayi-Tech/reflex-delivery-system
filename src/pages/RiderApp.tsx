import { useEffect, useState } from 'react';
import type { AuthUser, DeliveryRequest, DeliveryStatus } from '../types';
import { fetchRequests, subscribeToRequests, updateRequestStatus } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

/**
 * pages/RiderApp.tsx
 * Depends on: lib/api (fetchRequests scoped to this rider, updateRequestStatus, subscribeToRequests)
 * Persona: Rider (BRD §4) — sees only requests assigned to them (FR-14),
 * updates status Assigned → Picked Up → Delivered (FR-8). The delivered
 * step requires the tracking code shown to the customer at request
 * creation — the backend rejects a mismatch (FR-11), so a wrong code here
 * surfaces as a real error, not just UI validation.
 */

const NEXT_ACTION: Partial<Record<DeliveryStatus, { label: string; next: DeliveryStatus }>> = {
  assigned: { label: 'Mark as Picked Up', next: 'picked_up' },
  picked_up: { label: 'Confirm Delivered', next: 'delivered' },
};

export function RiderApp({ user }: { user: AuthUser }) {
  const [tasks, setTasks] = useState<DeliveryRequest[]>([]);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [scanCode, setScanCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests().then(setTasks).catch(() => {});
    const unsubscribe = subscribeToRequests(setTasks);
    return unsubscribe;
  }, []);

  const active = tasks.filter((t) => t.current_status === 'assigned' || t.current_status === 'picked_up');
  const done = tasks.filter((t) => t.current_status === 'delivered');

  async function advance(task: DeliveryRequest) {
    const action = NEXT_ACTION[task.current_status];
    if (!action) return;

    if (action.next === 'delivered' && confirmingId !== task.delivery_request_id) {
      setConfirmingId(task.delivery_request_id);
      setScanCode('');
      setError(null);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateRequestStatus(
        task.delivery_request_id,
        action.next,
        undefined,
        action.next === 'delivered' ? scanCode : undefined
      );
      setConfirmingId(null);
      fetchRequests().then(setTasks);
    } catch (err) {
      // Wrong tracking code surfaces here verbatim from the backend
      // (DeliveryService::transitionStatus) — the rider sees exactly why
      // the confirmation was rejected.
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen">
      <TopNav user={user} />

      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="font-display text-2xl font-semibold text-ink mb-4">My Tasks</h1>

        {active.length === 0 && (
          <Card className="p-6 text-sm text-ink/40 mb-6">No active deliveries assigned to you right now.</Card>
        )}

        <div className="space-y-4 mb-8">
          {active.map((task) => {
            const action = NEXT_ACTION[task.current_status];
            const isConfirming = confirmingId === task.delivery_request_id;
            return (
              <Card key={task.delivery_request_id} className="overflow-hidden">
                <div className="px-5 py-3 bg-sage/20 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-forest-deep">
                    {task.current_status === 'assigned' ? 'Active Delivery' : 'In Progress'}
                  </span>
                  <span className="text-xs text-ink/40 font-mono">{task.tracking_code}</span>
                </div>

                <div className="p-5">
                  <div className="mb-4">
                    <div className="text-xs uppercase text-ink/40 tracking-wide">Deliver to</div>
                    <div className="text-sm font-medium text-ink">{task.customer_address}</div>
                    <div className="text-xs text-ink/50 mt-0.5">
                      {task.customer_name} · {task.customer_phone}
                    </div>
                  </div>

                  <div className="text-xs text-ink/50 mb-4">
                    {task.item_description}
                    {task.weight_kg != null && ` · ${task.weight_kg}kg`}
                  </div>

                  {isConfirming ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5">
                          Tracking code (scan or type — from customer's copy)
                        </label>
                        <input
                          value={scanCode}
                          onChange={(e) => setScanCode(e.target.value)}
                          placeholder="FKS-XXXXXX"
                          className="w-full border border-ink/15 px-3 py-2.5 text-sm font-mono focus:outline-none focus:border-forest"
                        />
                      </div>
                      {error && <p className="text-xs text-rust">{error}</p>}
                      <div className="flex gap-2">
                        <Button onClick={() => advance(task)} disabled={busy} className="flex-1 justify-center flex">
                          {busy ? 'Confirming…' : 'Confirm Delivered'}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setConfirmingId(null);
                            setError(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {error && confirmingId === null && <p className="text-xs text-rust mb-2">{error}</p>}
                      {action && (
                        <Button
                          onClick={() => advance(task)}
                          disabled={busy}
                          className="w-full justify-center flex gap-2"
                        >
                          📦 {action.label}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {done.length > 0 && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-3">Completed</h2>
            <div className="space-y-2">
              {done.map((task) => (
                <Card key={task.delivery_request_id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-ink">{task.customer_name}</div>
                    <div className="text-xs text-ink/40">{task.item_description}</div>
                  </div>
                  <span className="text-xs text-forest">✓ Delivered</span>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
