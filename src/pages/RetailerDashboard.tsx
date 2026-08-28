import { useEffect, useState, type FormEvent } from 'react';
import type { AuthUser, DeliveryRequest, NewDeliveryRequestInput, StatusEvent } from '../types';
import { createRequest, fetchRequestEvents, fetchRequests, subscribeToRequests, ApiError } from '../lib/api';
import { TopNav } from '../components/TopNav';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

/**
 * pages/RetailerDashboard.tsx
 * Depends on: lib/api (fetchRequests, createRequest, fetchRequestEvents, subscribeToRequests)
 * Persona: Retailer staff (BRD §4) — logs a new delivery request (FR-1),
 * gets back a tracking code (FR-2), and can view status/history for any
 * request belonging to their retailer (FR-12) without contacting the rider.
 */

const EMPTY_FORM: NewDeliveryRequestInput = {
  customer_name: '',
  customer_phone: '',
  customer_address: '',
  item_description: '',
  weight_kg: undefined,
  priority: 'standard',
};

export function RetailerDashboard({ user }: { user: AuthUser }) {
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewDeliveryRequestInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [justCreated, setJustCreated] = useState<{ id: number; tracking_code: string } | null>(null);
  const [openProofId, setOpenProofId] = useState<number | null>(null);
  const [proofEvents, setProofEvents] = useState<StatusEvent[]>([]);

  useEffect(() => {
    fetchRequests().then(setRequests).catch(() => {});
    const unsubscribe = subscribeToRequests(setRequests);
    return unsubscribe;
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormErrors({});
    try {
      const result = await createRequest(form);
      setJustCreated(result);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchRequests().then(setRequests);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.fieldErrors) {
        setFormErrors(err.fieldErrors);
      } else {
        setFormErrors({ _general: 'Something went wrong. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function openProof(id: number) {
    setOpenProofId(id);
    const events = await fetchRequestEvents(id);
    setProofEvents(events);
  }

  const active = requests.filter((r) => r.current_status !== 'delivered');
  const completed = requests.filter((r) => r.current_status === 'delivered');

  return (
    <div className="min-h-screen">
      <TopNav user={user} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Delivery Requests</h1>
            <p className="text-sm text-ink/50">Log a request and track it through to proof of delivery.</p>
          </div>
          <Button onClick={() => setShowForm((v) => !v)}>{showForm ? 'Cancel' : '+ New Delivery Request'}</Button>
        </div>

        {justCreated && (
          <Card className="p-5 mb-6 border-amber/40 bg-amber/5 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-forest-deep">Request logged.</div>
              <div className="text-sm text-ink/70">
                Tracking code: <span className="font-mono font-semibold">{justCreated.tracking_code}</span> — share
                this with the customer; the rider will confirm delivery with it.
              </div>
            </div>
            <button onClick={() => setJustCreated(null)} className="text-ink/40 hover:text-ink text-sm">
              ✕
            </button>
          </Card>
        )}

        {showForm && (
          <Card className="p-6 mb-8">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field
                label="Customer name"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
                error={formErrors.customer_name}
              />
              <Field
                label="Customer phone"
                value={form.customer_phone}
                onChange={(v) => setForm({ ...form, customer_phone: v })}
                error={formErrors.customer_phone}
                placeholder="+2547..."
              />
              <Field
                label="Delivery address"
                value={form.customer_address}
                onChange={(v) => setForm({ ...form, customer_address: v })}
                error={formErrors.customer_address}
              />
              <Field
                label="Item description"
                value={form.item_description}
                onChange={(v) => setForm({ ...form, item_description: v })}
                error={formErrors.item_description}
              />
              <Field
                label="Weight (kg) — optional"
                type="number"
                value={form.weight_kg !== undefined ? String(form.weight_kg) : ''}
                onChange={(v) => setForm({ ...form, weight_kg: v ? Number(v) : undefined })}
                error={formErrors.weight_kg}
              />

              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Priority</label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.priority === 'standard'}
                    onChange={() => setForm({ ...form, priority: 'standard' })}
                  />
                  Standard
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    checked={form.priority === 'high'}
                    onChange={() => setForm({ ...form, priority: 'high' })}
                  />
                  High priority
                </label>
              </div>

              {formErrors._general && <p className="md:col-span-2 text-sm text-rust">{formErrors._general}</p>}

              <div className="md:col-span-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting…' : 'Submit request'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        <Section title="Active" count={active.length}>
          <RequestTable requests={active} onOpenProof={openProof} />
        </Section>

        <Section title="Completed" count={completed.length}>
          <RequestTable requests={completed} onOpenProof={openProof} />
        </Section>
      </main>

      {openProofId !== null && (
        <ProofModal requestId={openProofId} events={proofEvents} onClose={() => setOpenProofId(null)} />
      )}
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50">{title}</h2>
        <span className="text-xs text-ink/30">{count}</span>
      </div>
      {children}
    </div>
  );
}

function RequestTable({
  requests,
  onOpenProof,
}: {
  requests: DeliveryRequest[];
  onOpenProof: (id: number) => void;
}) {
  if (requests.length === 0) {
    return <Card className="p-6 text-sm text-ink/40">No requests here yet.</Card>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink/40">
            <th className="px-4 py-3 font-semibold">Tracking</th>
            <th className="px-4 py-3 font-semibold">Customer / Item</th>
            <th className="px-4 py-3 font-semibold">Deliver to</th>
            <th className="px-4 py-3 font-semibold">Rider</th>
            <th className="px-4 py-3 font-semibold">Priority</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r) => (
            <tr key={r.delivery_request_id} className="border-b border-ink/5 last:border-0">
              <td className="px-4 py-3 font-mono text-xs text-ink/60">{r.tracking_code}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-ink">{r.customer_name}</div>
                <div className="text-ink/50">{r.item_description}</div>
              </td>
              <td className="px-4 py-3 text-ink/60">{r.customer_address}</td>
              <td className="px-4 py-3 text-ink/60">{r.rider_name ?? '—'}</td>
              <td className="px-4 py-3">{r.priority && <PriorityBadge priority={r.priority} />}</td>
              <td className="px-4 py-3">
                <StatusBadge status={r.current_status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => onOpenProof(r.delivery_request_id)} className="text-xs text-forest hover:underline">
                  View timeline
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function ProofModal({
  requestId,
  events,
  onClose,
}: {
  requestId: number;
  events: StatusEvent[];
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center px-6 z-50" onClick={onClose}>
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-lg font-semibold">Delivery #{requestId} timeline</h3>
          <button onClick={onClose} className="text-ink/40 hover:text-ink">
            ✕
          </button>
        </div>
        <ol className="space-y-4">
          {events.map((e) => (
            <li key={e.status_id} className="flex gap-3">
              <div className="w-2 h-2 mt-1.5 bg-amber flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-ink capitalize">{e.new_status.replace('_', ' ')}</div>
                <div className="text-xs text-ink/50">
                  {e.changed_by_name} · {new Date(e.recorded_at).toLocaleString()}
                </div>
                {e.scan_reference && (
                  <div className="text-xs text-ink/60 mt-1">Confirmed with code {e.scan_reference}</div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-ink/50 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border px-3 py-2.5 text-sm focus:outline-none focus:border-forest ${
          error ? 'border-rust' : 'border-ink/15'
        }`}
      />
      {error && <p className="text-xs text-rust mt-1">{error}</p>}
    </div>
  );
}