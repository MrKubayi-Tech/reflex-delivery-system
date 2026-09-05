# Fikisha (Reflex Delivery System) 🚚

A last-mile delivery workflow for small retailers: a retailer logs a
delivery, a dispatcher assigns it to a rider, and the rider updates its
status through to a scan-verified drop-off.

**Stack:** React + TypeScript + Vite + Tailwind on the frontend, plain PHP
(no framework) + MySQL on the backend, talking over a small JSON REST API.

---

## How it works

```
 Retailer                Dispatcher               Rider
 --------                ----------               -----
 Creates a request  -->  Sees it as "pending" -->  (not yet involved)
                         Assigns a rider       -->  Sees it as "assigned"
                                                     Marks "picked up"
                                                     Scans + marks "delivered"
```

- **Retailer** — logs new delivery requests (customer, address, item) and
  tracks their own requests through to delivery.
- **Dispatcher** — sees every pending request, assigns it to an available
  rider, and can see the whole fleet's load.
- **Rider** — sees only what's assigned to them and moves it forward one
  step at a time. Marking something "delivered" requires scanning/entering
  the delivery's tracking code.

Status only ever moves forward: `pending → assigned → picked_up →
delivered`. Both frontend and backend enforce that chain independently.

---

## Project structure

```
reflex-delivery-system/
├── src/                          # Frontend (React + TS)
│   ├── pages/                    # Login, Register, and the three dashboards
│   ├── components/                # Shared UI (buttons, cards, modals)
│   ├── hooks/                    # useLogoutFlow, useAutoLogout
│   ├── lib/
│   │   ├── api.ts                # The only place that calls fetch()
│   │   └── auth.ts               # Token/session storage (localStorage)
│   └── types/                    # Shared TS types, mirrors the DB shape
│
├── reflex-delivery-system-api/   # Backend (plain PHP, no framework)
│   ├── public/
│   │   ├── index.php             # Single entry point
│   │   └── .htaccess             # Rewrites everything through index.php
│   └── src/
│       ├── auth/                 # login, register, logout, password reset
│       ├── requests/             # create, list, assign, status, events
│       ├── classes/
│       │   ├── Auth.php          # Token issuing/verification/revocation
│       │   └── Database.php      # PDO connection, reads .env/db_config.xml
│       ├── config/
│       │   ├── config.php        # Bootstraps the router
│       │   └── router.config.php # Hand-rolled request router
│       └── .env/db_config.xml    # DB host/name/user/password
│
└── sql/
    ├── create.sql                # Original bare schema (users, deliveries)
    └── migration.sql             # Evolves it to the current schema — run
                                   # both, in order, on a fresh database
```

---

## Getting started

### Prerequisites

- Node.js 18+ and npm
- PHP 8+ with the `pdo_mysql` extension
- MySQL (via XAMPP, or standalone)

### 1. Database

Create a database (the default config expects it to be named `dispatch`),
then run the two SQL files **in order**:

```bash
mysql -u root dispatch < sql/create.sql
mysql -u root dispatch < sql/migration.sql
```

Check `reflex-delivery-system-api/src/.env/db_config.xml` matches your
local MySQL host/user/password:

```xml
<database>
    <host>localhost</host>
    <dbname>dispatch</dbname>
    <dbuser>root</dbuser>
    <dbpwd></dbpwd>
</database>
```

### 2. Backend

From `reflex-delivery-system-api/public`, either:

- point an Apache vhost (with `mod_rewrite`) at this folder, **or**
- run PHP's built-in server for local dev:
  ```bash
  cd reflex-delivery-system-api/public
  php -S 127.0.0.1:8099
  ```

### 3. Frontend

```bash
npm install
npm run dev
```

Vite runs on `http://localhost:5173` and proxies `/api/*` to
`http://127.0.0.1:8099` (see `vite.config.ts`) — so the backend needs to
already be running on that port for the dev proxy to work.

### 4. Log in

Use the register page to create an account for each role
(`retailer`, `dispatcher`, `rider`), or insert test users directly via SQL.

---

## API overview

All endpoints live under `/api/` and return JSON. Authenticated endpoints
expect `Authorization: Bearer <token>`.

| Method | Endpoint                    | Who               | Purpose                        |
| ------ | --------------------------- | ----------------- | ------------------------------ |
| POST   | `/api/auth/register`        | anyone            | Create an account              |
| POST   | `/api/auth/login`           | anyone            | Get a bearer token             |
| POST   | `/api/auth/logout`          | authenticated     | Revoke the current token       |
| POST   | `/api/auth/forgot-password` | anyone            | Request a reset token          |
| POST   | `/api/auth/reset-password`  | anyone            | Reset password with token      |
| GET    | `/api/requests`             | authenticated     | List requests (scoped by role) |
| POST   | `/api/requests`             | retailer          | Create a delivery request      |
| GET    | `/api/requests/{id}/events` | authenticated     | Status history for a request   |
| POST   | `/api/requests/{id}/assign` | dispatcher        | Assign a rider (pending only)  |
| PATCH  | `/api/requests/{id}/status` | rider, dispatcher | Advance status one step        |
| GET    | `/api/riders`               | dispatcher        | List riders + rough capacity   |

### Auth & sessions

- Tokens are opaque random strings stored in `auth_tokens`, with a 24h
  expiry set at issue time (`Auth::issueToken`).
- `POST /api/auth/logout` deletes the token row so it can't be replayed.
- The frontend also tracks its own idle timeout (15 min of no activity)
  and expiry check, and force-logs-out with a reason shown on the login
  screen (`?reason=idle` / `?reason=expired`).

---

## Known limitations

- **No live push updates yet.** `subscribeToRequests()` on the frontend
  opens an `EventSource` against `/api/stream/requests`, but the backend
  router has no `stream` route — that connection currently just fails
  silently. In practice, each page picks up its _own_ actions immediately
  (it refetches after creating/assigning/updating), but won't see another
  user's change until it's reloaded or its own next fetch. Worth
  implementing a real SSE (or polling) endpoint if live cross-tab sync
  matters for how this is used.
- **Rider capacity is a placeholder.** `capacity_pct` in `/api/riders` is
  a rough guess (active deliveries × 20%), not a real capacity model.
- **One account per person.** A retailer's _business_ and the _person_
  logging in are the same row — there's no multi-staff-per-shop login yet
  (see the comment in `sql/migration.sql`).

---

## Scripts

```bash
npm run dev       # start the Vite dev server
npm run build      # type-check + production build
npm run preview    # preview the production build locally
npm run lint       # eslint over src/
```
