-- Reflex: schema migration to close the frontend/backend gap.
-- Run this against your existing `dispatch` database (phpMyAdmin > SQL tab,
-- or `mysql -u root dispatch < migration.sql`).
-- Safe to run once on your current schema (users + deliveries as you showed).

-- 1. Extend users with role + profile fields the frontend's NewUserInput/
--    AuthUser/Rider types expect. We keep one account = one entity (a
--    retailer owner, a dispatcher, or a rider) rather than modeling
--    separate "business" and "staff" entities — simpler, but means a shop
--    can't yet have multiple staff logins. Worth naming as a trade-off.
ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'retailer' AFTER name,
  ADD COLUMN business_name VARCHAR(255) DEFAULT NULL,
  ADD COLUMN business_address VARCHAR(255) DEFAULT NULL,
  ADD COLUMN vehicle_type VARCHAR(20) DEFAULT NULL,
  ADD COLUMN availability VARCHAR(20) NOT NULL DEFAULT 'idle';

-- Your existing test row(s) become role='retailer' by default — fine for
-- now, but if you registered a dispatcher/rider via curl earlier, update
-- it manually, e.g.:
--   UPDATE users SET role = 'dispatcher' WHERE phone = '...';

-- 2. Auth tokens actually need to be persisted and checked — right now
-- login/register generate a random token and hand it to the client, but
-- nothing on the server ever verifies it again on later requests. Every
-- authenticated endpoint currently trusts whatever the client claims.
CREATE TABLE auth_tokens (
    token VARCHAR(64) PRIMARY KEY,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 2b. Token expiry + logout support. NULL means "never expires" so this is
-- safe to run without invalidating anyone already logged in; login/register
-- always set a real expires_at going forward (see Auth::issueToken).
-- Auth::currentUser() rejects tokens where expires_at has passed, and
-- POST /auth/logout deletes the row outright so a logged-out token can't
-- be replayed.
ALTER TABLE auth_tokens
  ADD COLUMN expires_at TIMESTAMP NULL DEFAULT NULL;

-- 3. Rebuild deliveries -> delivery_requests to match src/types.ts:
-- DeliveryRequest. Renaming in place keeps your existing rows.
ALTER TABLE deliveries
  CHANGE COLUMN id delivery_request_id INT AUTO_INCREMENT NOT NULL,
  CHANGE COLUMN address customer_address VARCHAR(255) NOT NULL,
  CHANGE COLUMN status current_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  CHANGE COLUMN rider_id assigned_rider_id INT DEFAULT NULL,
  ADD COLUMN retailer_id INT DEFAULT NULL AFTER delivery_request_id,
  ADD COLUMN created_by INT DEFAULT NULL AFTER retailer_id,
  ADD COLUMN dispatcher_id INT DEFAULT NULL AFTER assigned_rider_id,
  ADD COLUMN weight_kg DECIMAL(6,2) DEFAULT NULL,
  ADD COLUMN priority VARCHAR(10) NOT NULL DEFAULT 'standard',
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

RENAME TABLE deliveries TO delivery_requests;

-- retailer_id/created_by are nullable above so the ALTER doesn't fail on
-- any existing rows you created via curl. If you have old test rows,
-- either delete them or backfill, e.g.:
--   UPDATE delivery_requests SET retailer_id = 1, created_by = 1 WHERE retailer_id IS NULL;

-- 4. Status history, per StatusEvent in types.ts.
CREATE TABLE status_events (
    status_id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_request_id INT NOT NULL,
    changed_by INT NOT NULL,
    previous_status VARCHAR(20) DEFAULT NULL,
    new_status VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scan_reference VARCHAR(64) DEFAULT NULL,
    FOREIGN KEY (delivery_request_id) REFERENCES delivery_requests(delivery_request_id),
    FOREIGN KEY (changed_by) REFERENCES users(id)
);
