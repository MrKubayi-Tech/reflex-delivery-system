import { getToken, clearSession } from './auth';
import type {
  AuthUser,
  DeliveryRequest,
  DeliveryStatus,
  NewDeliveryRequestInput,
  NewUserInput,
  Rider,
  StatusEvent,
} from '../types';

/**
 * lib/api.ts
 *
 * The only place in the frontend that calls fetch(). Every page/component
 * goes through these functions — this is the "consumes backend/api"
 * boundary referenced in ARCHITECTURE.md. Centralizing it here means the
 * 401-redirect-to-login behavior, error shape, and auth header are all
 * handled once.
 */

interface ApiErrorBody {
  error?: { code: string; message: string };
  data?: { errors?: Record<string, string> };
}

export class ApiError extends Error {
  /** Field-name -> message, present only on 422 validation failures. */
  public fieldErrors?: Record<string, string>;

  constructor(public status: number, public code: string, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.fieldErrors = fieldErrors;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    // fetch() throws (not a rejected-with-status Response) when the
    // network is down or the backend is unreachable. Wrap it so every
    // caller can rely on catching ApiError alone instead of also
    // handling a bare TypeError differently.
    throw new ApiError(0, 'network_error', 'Could not reach the server. Check your connection and try again.');
  }

  if (res.status === 401) {
    clearSession();
    window.location.href = '/login';
    throw new ApiError(401, 'unauthorized', 'Session expired.');
  }

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    // The backend always sends JSON (see public/index.php's shutdown
    // handler), but guard anyway so a malformed response becomes a
    // readable error instead of an uncaught parse exception.
    throw new ApiError(res.status, 'invalid_response', 'The server returned an unexpected response.');
  }

  if (!res.ok) {
    const errBody = body as ApiErrorBody;
    // Two distinct error shapes from the backend: structured errors go
    // through Response::error() -> {"error": {code, message}}. Field-level
    // validation failures go through Response::json(['errors' => ...], 422)
    // -> {"data": {"errors": {...}}} — same envelope as a success response,
    // just with a 4xx status. Handle both here so every caller gets a
    // consistent ApiError regardless of which path the backend took.
    if (errBody.data?.errors) {
      throw new ApiError(res.status, 'validation_error', 'Please fix the highlighted fields.', errBody.data.errors);
    }
    throw new ApiError(res.status, errBody.error?.code ?? 'error', errBody.error?.message ?? 'Request failed.');
  }

  return (body as { data: T }).data;
}

export async function login(phone: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone, password }) });
}

export async function register(input: NewUserInput): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/register', { method: 'POST', body: JSON.stringify(input) });
}

/**
 * Revokes the current token server-side. Callers should clear the local
 * session and redirect regardless of whether this succeeds — a network
 * failure here shouldn't be able to trap someone in a logged-in UI.
 */
export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
}

export async function fetchRequests(status?: DeliveryStatus): Promise<DeliveryRequest[]> {
  const qs = status ? `?status=${status}` : '';
  return request(`/api/requests${qs}`);
}

export async function fetchRequestEvents(id: number): Promise<StatusEvent[]> {
  return request(`/api/requests/${id}/events`);
}

export async function createRequest(
  input: NewDeliveryRequestInput
): Promise<{ id: number; tracking_code: string }> {
  return request('/api/requests', { method: 'POST', body: JSON.stringify(input) });
}

export async function assignRider(requestId: number, riderId: number): Promise<void> {
  return request(`/api/requests/${requestId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ rider_id: riderId }),
  });
}

/**
 * scanReference is required by the backend when status is 'delivered'
 * (FR-11) — it must match the delivery's tracking_code exactly.
 */
export async function updateRequestStatus(
  requestId: number,
  status: DeliveryStatus,
  note?: string,
  scanReference?: string
): Promise<void> {
  return request(`/api/requests/${requestId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note, scan_reference: scanReference }),
  });
}

export async function fetchAvailableRiders(): Promise<Rider[]> {
  return request('/api/riders');
}

/**
 * Polls GET /api/requests on an interval so the retailer and dispatcher
 * dashboards stay roughly in sync with each other without a live push
 * channel — the backend has no SSE/WebSocket endpoint (see
 * DESIGN.md Section 6.2, "No live push updates"), and a previous version
 * of this file pointed EventSource at /api/stream/requests, which
 * doesn't exist and just failed and silently reconnected forever.
 *
 * Returns an unsubscribe function; callers must invoke it on unmount to
 * stop the interval. `onError` fires when a poll fails (e.g. dropped
 * connection) so the UI can show a "sync failed" indicator without
 * throwing the failure away.
 */
export function pollRequests(
  onUpdate: (requests: DeliveryRequest[]) => void,
  options: { status?: DeliveryStatus; intervalMs?: number; onError?: (err: unknown) => void } = {}
): () => void {
  const { status, intervalMs = 15000, onError } = options;
  let cancelled = false;

  async function tick() {
    try {
      const data = await fetchRequests(status);
      if (!cancelled) onUpdate(data);
    } catch (err) {
      if (!cancelled) onError?.(err);
    }
  }

  const interval = setInterval(tick, intervalMs);
  return () => {
    cancelled = true;
    clearInterval(interval);
  };
}