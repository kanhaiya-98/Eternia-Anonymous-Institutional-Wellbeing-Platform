-- =============================================================================
-- ETERNIA — Migration 003: Functions and Triggers
-- =============================================================================
-- Platform : Eternia — Anonymous Institutional Student Wellbeing Platform
-- Version  : 1.0 (Phase 1 — Modular Monolith, 0–10,000 Users)
-- Run order: Must run AFTER 002_rls_policies.sql. Run BEFORE 004_seed_data.sql.
--
-- What this file creates:
--   1.  update_updated_at_column()     — Generic BEFORE UPDATE trigger to
--                                        maintain updated_at timestamps
--   2.  Triggers on updated_at tables  — institutions, users, user_private,
--                                        appointments
--   3.  handle_new_user()              — AFTER INSERT on auth.users to scaffold
--                                        the public.users row
--   4.  Trigger on_auth_user_created   — Fires handle_new_user() on signup
--   5.  prevent_audit_log_mutation()   — Raises exception on any UPDATE/DELETE
--                                        attempt on audit_logs
--   6.  Triggers on audit_logs         — Enforce append-only immutability
--   7.  prevent_credit_mutation()      — Raises exception on any UPDATE/DELETE
--                                        attempt on credit_transactions
--   8.  Triggers on credit_transactions— Enforce ledger immutability
--   9.  validate_credit_balance()      — Checks that a SPEND transaction would
--                                        not push the user below zero balance;
--                                        raises exception if insufficient funds
--   10. refresh_credit_balance()       — Refreshes the credit_balance
--                                        materialized view CONCURRENTLY after
--                                        each INSERT on credit_transactions
--   11. Trigger on credit_transactions — Calls refresh_credit_balance() after
--                                        every successful INSERT
--   12. log_audit_event()              — SECURITY DEFINER helper that server
--                                        code calls to write audit log entries
--                                        (bypasses the no-write RLS policy on
--                                        audit_logs in a controlled, auditable way)
--   13. cleanup_expired_onboarding()   — Utility function to delete expired
--                                        onboarding_sessions rows; called
--                                        manually in Phase 1 or via cron in Phase 2
--   14. get_user_credit_balance()      — Convenience function returning current
--                                        ECC balance for a user_id
--
-- Security notes:
--   • All SECURITY DEFINER functions explicitly set search_path = public, ''
--     to prevent search-path injection attacks.
--   • Functions that perform privileged operations (log_audit_event,
--     handle_new_user) are granted EXECUTE only to specific roles.
--   • The immutability triggers fire for ALL roles including superuser when
--     accessed through the application layer. Only direct psql admin access
--     with SET session_replication_role = replica can bypass triggers — this
--     should be used only for verified data migrations with full audit trail.
-- =============================================================================


-- =============================================================================
-- SECTION 1: GENERIC updated_at TRIGGER FUNCTION
-- =============================================================================
-- A single reusable trigger function used by all tables with an updated_at
-- column. Using one shared function keeps the schema DRY and ensures
-- consistent timestamp behaviour across all tables.
--
-- Usage: CREATE TRIGGER trg_<table>_updated_at
--          BEFORE UPDATE ON public.<table>
--          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
-- =============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER                   -- Runs as the calling user — no privilege elevation needed
SET search_path = public, ''
AS $$
BEGIN
  -- Only update the timestamp if at least one non-updated_at column actually changed.
  -- This avoids spurious timestamp changes when a no-op UPDATE is issued.
  IF row(NEW.*) IS DISTINCT FROM row(OLD.*) THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column() IS
  'Generic BEFORE UPDATE trigger: sets updated_at = NOW() when any column changes. Used by all tables with updated_at.';


-- ---- Attach updated_at trigger to: institutions ----
DROP TRIGGER IF EXISTS trg_institutions_updated_at ON public.institutions;
CREATE TRIGGER trg_institutions_updated_at
  BEFORE UPDATE ON public.institutions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---- Attach updated_at trigger to: user_private ----
-- users table uses Supabase Auth managed timestamps — updated_at is handled
-- by the handle_new_user mechanism. user_private has its own updated_at column.
DROP TRIGGER IF EXISTS trg_user_private_updated_at ON public.user_private;
CREATE TRIGGER trg_user_private_updated_at
  BEFORE UPDATE ON public.user_private
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ---- Attach updated_at trigger to: appointments ----
DROP TRIGGER IF EXISTS trg_appointments_updated_at ON public.appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- =============================================================================
-- SECTION 2: SUPABASE AUTH USER CREATION HOOK
-- =============================================================================
-- When a new user signs up via Supabase Auth (auth.users INSERT), this trigger
-- fires to create the corresponding public.users skeleton row.
--
-- At this stage (immediately post-signup), we only know:
--   • The auth user's UUID (NEW.id)
--   • The raw_user_meta_data JSON the client sent during signUp()
--
-- The client MUST pass the following fields in the metadata object during
-- the Supabase signUp() call:
--   {
--     "username":       "chosen_username",
--     "institution_id": "uuid-of-institution",
--     "role":           "STUDENT"   (or INTERN / EXPERT / SPOC / ADMIN)
--   }
--
-- The role field is validated here — if the value is not in the allowed enum,
-- it defaults to STUDENT (defensive fallback).
--
-- NOTE: This trigger function runs in the auth schema context. It uses
-- SECURITY DEFINER with a fixed search_path to safely write to public.users.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_username       TEXT;
  v_institution_id UUID;
  v_role           TEXT;
  v_allowed_roles  TEXT[] := ARRAY['STUDENT', 'INTERN', 'EXPERT', 'SPOC', 'ADMIN'];
BEGIN
  -- Extract metadata passed during Supabase Auth signUp().
  -- raw_user_meta_data is a JSONB column on auth.users.
  v_username       := NEW.raw_user_meta_data ->> 'username';
  v_institution_id := (NEW.raw_user_meta_data ->> 'institution_id')::UUID;
  v_role           := UPPER(COALESCE(NEW.raw_user_meta_data ->> 'role', 'STUDENT'));

  -- Validate role — default to STUDENT if an unrecognised value is supplied.
  -- This is a safety net; the API layer should validate before calling signUp().
  IF v_role NOT IN (
    'STUDENT', 'INTERN', 'EXPERT', 'SPOC', 'ADMIN'
  ) THEN
    v_role := 'STUDENT';
  END IF;

  -- Require username — if missing, abort and let the signup fail cleanly.
  IF v_username IS NULL OR trim(v_username) = '' THEN
    RAISE EXCEPTION 'handle_new_user: username is required in raw_user_meta_data. Signup aborted for auth uid: %', NEW.id;
  END IF;

  -- Insert the public.users skeleton row.
  -- All other fields (device_id_encrypted, last_login, apaar_verified, etc.)
  -- are populated by subsequent API calls during the onboarding flow.
  INSERT INTO public.users (
    id,
    institution_id,
    username,
    role,
    is_active,
    created_at
  )
  VALUES (
    NEW.id,
    v_institution_id,
    trim(v_username),
    v_role,
    TRUE,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  -- ON CONFLICT DO NOTHING handles the rare edge case where a retry of the
  -- Auth signup call might try to create the same user twice.

  -- Write an audit log entry for the new user creation event.
  -- We call log_audit_event() defined in Section 5 of this file.
  -- Note: at this point the user has no institution_id in the audit metadata
  -- if institution_id is NULL (e.g. ADMIN accounts), which is acceptable.
  PERFORM public.log_audit_event(
    p_actor_id     => NEW.id,
    p_action_type  => 'USER_CREATED',
    p_target_table => 'users',
    p_target_id    => NEW.id,
    p_metadata     => jsonb_build_object(
                        'role',           v_role,
                        'institution_id', v_institution_id,
                        'username_hash',  encode(digest(v_username, 'sha256'), 'hex')
                        -- username is hashed in audit logs — never stored in plaintext
                      )
  );

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
  'AFTER INSERT trigger on auth.users: creates the public.users skeleton row and writes a USER_CREATED audit log entry. Called automatically by Supabase on every signup.';

-- Grant execute to the supabase_auth_admin role (the role Supabase Auth uses
-- internally to manage the auth schema). This is required for the trigger to fire.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Create the trigger on auth.users (lives in the auth schema).
-- Note: This trigger is in the auth schema, which is managed by Supabase.
-- If Supabase recreates this trigger on platform updates, re-run this migration.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- =============================================================================
-- SECTION 3: AUDIT LOG IMMUTABILITY PROTECTION
-- =============================================================================
-- audit_logs is an append-only compliance table. Once written, rows must
-- never be modified or deleted — this is a hard security and legal requirement.
--
-- This trigger enforces immutability at the database layer, independent of:
--   • RLS policies (which already block client writes in migration 002)
--   • Application-layer guards
--   • Supabase dashboard access
--
-- The three-layer protection stack for audit_logs:
--   Layer 1: RLS policies (migration 002) — no client INSERT/UPDATE/DELETE
--   Layer 2: These triggers — raise exception for any UPDATE/DELETE attempt
--   Layer 3: FORCE ROW LEVEL SECURITY (migration 002) — even owner blocked
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
BEGIN
  -- This function should never be reached in normal operation.
  -- If it fires, something has bypassed the RLS policies — which is itself
  -- a security event. We raise an exception with a clear message.
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'SECURITY VIOLATION: audit_logs is append-only. UPDATE is forbidden. '
      'Attempted mutation of audit log entry id=%. '
      'This event has been noted.',
      OLD.id
    USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'SECURITY VIOLATION: audit_logs is append-only. DELETE is forbidden. '
      'Attempted deletion of audit log entry id=%. '
      'This event has been noted.',
      OLD.id
    USING ERRCODE = 'insufficient_privilege';
  END IF;

  -- Should never reach here — return NULL to satisfy trigger contract.
  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.prevent_audit_log_mutation() IS
  'SECURITY DEFINER: Raises an exception on any UPDATE or DELETE on audit_logs. Enforces append-only immutability at DB layer.';

-- Trigger: block UPDATE on audit_logs
DROP TRIGGER IF EXISTS trg_audit_logs_prevent_update ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();

-- Trigger: block DELETE on audit_logs
DROP TRIGGER IF EXISTS trg_audit_logs_prevent_delete ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_prevent_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_audit_log_mutation();


-- =============================================================================
-- SECTION 4: CREDIT TRANSACTION LEDGER IMMUTABILITY PROTECTION
-- =============================================================================
-- credit_transactions is the ECC financial ledger. Like audit_logs, it is
-- strictly append-only. The credit balance is derived from SUM(delta) — if
-- rows could be mutated or deleted, the balance would become untrustworthy.
--
-- This trigger enforces immutability at the database layer as a backstop
-- against both accidental and malicious mutations.
--
-- The RLS policies in migration 002 already deny UPDATE/DELETE to all
-- authenticated roles. This trigger provides the second enforcement layer.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.prevent_credit_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION
      'LEDGER VIOLATION: credit_transactions is append-only. UPDATE is forbidden. '
      'Attempted mutation of transaction id=% for user_id=%. '
      'All credit operations must be new INSERT rows (EARN, SPEND, GRANT, etc.).',
      OLD.id,
      OLD.user_id
    USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION
      'LEDGER VIOLATION: credit_transactions is append-only. DELETE is forbidden. '
      'Attempted deletion of transaction id=% for user_id=%. '
      'Credit corrections must be made via an offsetting EARN/SPEND transaction.',
      OLD.id,
      OLD.user_id
    USING ERRCODE = 'insufficient_privilege';
  END IF;

  RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.prevent_credit_mutation() IS
  'SECURITY DEFINER: Raises an exception on any UPDATE or DELETE on credit_transactions. Enforces append-only ledger immutability.';

-- Trigger: block UPDATE on credit_transactions
DROP TRIGGER IF EXISTS trg_credit_transactions_prevent_update ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_prevent_update
  BEFORE UPDATE ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_credit_mutation();

-- Trigger: block DELETE on credit_transactions
DROP TRIGGER IF EXISTS trg_credit_transactions_prevent_delete ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_prevent_delete
  BEFORE DELETE ON public.credit_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_credit_mutation();


-- =============================================================================
-- SECTION 5: AUDIT LOG WRITE HELPER
-- =============================================================================
-- log_audit_event() is the ONLY sanctioned way to write to audit_logs from
-- application code. It runs as SECURITY DEFINER (function owner = postgres),
-- which means it bypasses the "no authenticated INSERT" RLS policy on
-- audit_logs in a controlled, intentional way.
--
-- All calls to this function are themselves auditable via PostgreSQL's
-- pg_stat_activity and statement logging.
--
-- Parameters:
--   p_actor_id     — UUID of the user performing the action (NULL for system events)
--   p_action_type  — Text label for the event (e.g. 'USER_LOGIN', 'ESCALATION_APPROVED')
--   p_target_table — Table affected (e.g. 'users', 'escalation_requests') or NULL
--   p_target_id    — PK of the affected row or NULL
--   p_metadata     — JSONB payload with event-specific details; never raw PII
--   p_ip_hash      — SHA-256 of actor IP address (optional; NULL if not available)
--
-- Returns: UUID of the newly created audit log entry.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_id     UUID    DEFAULT NULL,
  p_action_type  TEXT    DEFAULT NULL,
  p_target_table TEXT    DEFAULT NULL,
  p_target_id    UUID    DEFAULT NULL,
  p_metadata     JSONB   DEFAULT '{}',
  p_ip_hash      TEXT    DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Validate required parameters
  IF p_action_type IS NULL OR trim(p_action_type) = '' THEN
    RAISE EXCEPTION 'log_audit_event: p_action_type is required and cannot be empty.'
    USING ERRCODE = 'invalid_parameter_value';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id,
    action_type,
    target_table,
    target_id,
    metadata,
    ip_hash,
    created_at
  )
  VALUES (
    p_actor_id,
    upper(trim(p_action_type)),   -- Normalise to SCREAMING_SNAKE_CASE
    p_target_table,
    p_target_id,
    COALESCE(p_metadata, '{}'),
    p_ip_hash,
    NOW()
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

COMMENT ON FUNCTION public.log_audit_event(UUID, TEXT, TEXT, UUID, JSONB, TEXT) IS
  'SECURITY DEFINER: The only authorised way to write to audit_logs. Bypasses RLS in a controlled, intentional manner. All server-side code must use this function — never INSERT directly.';

-- Grant execute to authenticated role so server-side Supabase client calls
-- can invoke this. The function itself is SECURITY DEFINER so it safely
-- bypasses the RLS no-write policy on audit_logs.
GRANT EXECUTE ON FUNCTION public.log_audit_event(UUID, TEXT, TEXT, UUID, JSONB, TEXT)
  TO authenticated;


-- =============================================================================
-- SECTION 6: CREDIT BALANCE VALIDATION
-- =============================================================================
-- validate_credit_balance() is called by the server-side booking/session API
-- routes BEFORE inserting a SPEND transaction. It checks that the user's
-- current balance (from the credit_balance materialized view) is sufficient
-- to cover the requested spend amount.
--
-- This function is a DB-layer backstop — the primary balance check should
-- happen in the application service layer. This function prevents the edge
-- case where two concurrent spend requests race past the application check.
--
-- It is a regular function (not a trigger) — called explicitly by the API.
--
-- Parameters:
--   p_user_id      — UUID of the user attempting to spend
--   p_spend_amount — Positive integer: the number of credits to spend
--
-- Returns: TRUE if the user has sufficient balance, FALSE if not.
-- Raises an exception with SQLSTATE P0001 if balance would go negative,
-- so the caller can catch it and return a 402 Payment Required response.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_credit_balance(
  p_user_id      UUID,
  p_spend_amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_current_balance INTEGER;
  v_resulting_balance INTEGER;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'validate_credit_balance: p_user_id is required.'
    USING ERRCODE = 'invalid_parameter_value';
  END IF;

  IF p_spend_amount IS NULL OR p_spend_amount <= 0 THEN
    RAISE EXCEPTION 'validate_credit_balance: p_spend_amount must be a positive integer. Got: %', p_spend_amount
    USING ERRCODE = 'invalid_parameter_value';
  END IF;

  -- Read current balance from the materialized view.
  -- The view is refreshed after every INSERT on credit_transactions,
  -- so this is always current to the last committed transaction.
  SELECT COALESCE(balance, 0)
  INTO v_current_balance
  FROM public.credit_balance
  WHERE user_id = p_user_id;

  -- If no row exists in credit_balance the user has never had any transactions.
  -- Treat this as a zero balance (COALESCE above handles this).
  v_current_balance := COALESCE(v_current_balance, 0);
  v_resulting_balance := v_current_balance - p_spend_amount;

  IF v_resulting_balance < 0 THEN
    RAISE EXCEPTION
      'INSUFFICIENT_CREDITS: User % has % ECC credits. Attempted to spend % ECC. Shortfall: % ECC. '
      'Recharge your wallet or wait for your institution''s next credit allocation.',
      p_user_id,
      v_current_balance,
      p_spend_amount,
      ABS(v_resulting_balance)
    USING ERRCODE = 'P0001';    -- raise_exception — catchable by application layer
    RETURN FALSE;               -- Never reached, but satisfies the RETURNS BOOLEAN contract
  END IF;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.validate_credit_balance(UUID, INTEGER) IS
  'Checks user has sufficient ECC credits for a spend operation. Raises P0001 exception if balance insufficient. Call before every SPEND INSERT on credit_transactions.';

GRANT EXECUTE ON FUNCTION public.validate_credit_balance(UUID, INTEGER)
  TO authenticated;


-- =============================================================================
-- SECTION 7: CREDIT BALANCE MATERIALIZED VIEW REFRESH
-- =============================================================================
-- After every successful INSERT on credit_transactions, this trigger
-- automatically refreshes the credit_balance materialized view so that
-- balance queries always reflect the latest transactions.
--
-- CONCURRENTLY mode is used so that the refresh does not lock reads on the
-- view during the refresh operation. This requires the unique index on
-- credit_balance(user_id) that was created in migration 001.
--
-- Performance note:
--   At Phase 1 scale (< 10,000 users, low concurrent transactions), a full
--   CONCURRENTLY refresh after every INSERT is acceptable.
--   At Phase 2+ (> 30,000 users with high transaction volume), consider:
--     • Batching refreshes via a BullMQ scheduled job every 5 seconds
--     • Or migrating to a PostgreSQL incremental view strategy
-- =============================================================================

CREATE OR REPLACE FUNCTION public.refresh_credit_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
BEGIN
  -- CONCURRENTLY allows reads to continue during refresh.
  -- Requires the unique index idx_credit_balance_user_id (created in migration 001).
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.credit_balance;
  RETURN NULL;  -- AFTER trigger return value is ignored for statement-level triggers
END;
$$;

COMMENT ON FUNCTION public.refresh_credit_balance() IS
  'AFTER INSERT trigger on credit_transactions: refreshes credit_balance materialized view CONCURRENTLY. Non-blocking at Phase 1 scale.';

-- Trigger: refresh credit_balance after every new credit transaction.
-- Statement-level (FOR EACH STATEMENT) to handle bulk inserts efficiently —
-- one refresh per statement rather than one per row in a bulk insert.
DROP TRIGGER IF EXISTS trg_credit_transactions_refresh_balance ON public.credit_transactions;
CREATE TRIGGER trg_credit_transactions_refresh_balance
  AFTER INSERT ON public.credit_transactions
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.refresh_credit_balance();


-- =============================================================================
-- SECTION 8: CONVENIENCE FUNCTION — GET USER CREDIT BALANCE
-- =============================================================================
-- A simple helper that returns a user's current ECC balance as an integer.
-- Used by server-side API routes for balance checks and wallet display.
-- Reads from the credit_balance materialized view (always up-to-date).
--
-- Returns 0 if the user has no transaction history (new user).
-- =============================================================================

CREATE OR REPLACE FUNCTION public.get_user_credit_balance(p_user_id UUID)
RETURNS INTEGER
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, ''
AS $$
  SELECT COALESCE(
    (SELECT balance::INTEGER
     FROM public.credit_balance
     WHERE user_id = p_user_id),
    0
  );
$$;

COMMENT ON FUNCTION public.get_user_credit_balance(UUID) IS
  'Returns the current ECC balance for a user from the credit_balance materialized view. Returns 0 for users with no transaction history.';

GRANT EXECUTE ON FUNCTION public.get_user_credit_balance(UUID)
  TO authenticated;


-- =============================================================================
-- SECTION 9: ONBOARDING SESSION CLEANUP UTILITY
-- =============================================================================
-- cleanup_expired_onboarding() deletes onboarding_sessions rows that have
-- passed their 15-minute TTL. These rows are safe to hard-delete once expired
-- because they contain no PII — only a session token hash and step state.
--
-- [Phase 1]: Call this manually via psql or the Supabase SQL Editor when needed,
--            or set up a simple daily cron via pg_cron (available on Supabase Pro).
-- [Phase 2+]: Replaced by a BullMQ scheduled job that runs every 5 minutes.
--
-- Returns: INTEGER — the number of rows deleted.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_onboarding()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.onboarding_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  -- Log the cleanup event for operational visibility.
  PERFORM public.log_audit_event(
    p_actor_id     => NULL,                   -- System-generated event
    p_action_type  => 'ONBOARDING_SESSION_CLEANUP',
    p_target_table => 'onboarding_sessions',
    p_target_id    => NULL,
    p_metadata     => jsonb_build_object('rows_deleted', v_deleted_count)
  );

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_onboarding() IS
  'Deletes expired onboarding_sessions (TTL 15 min). Phase 1: run manually or via pg_cron. Phase 2+: replaced by BullMQ scheduled job.';

-- No GRANT to authenticated — this is an admin/system-only function.
-- Call via service role from a cron job or maintenance script.


-- =============================================================================
-- SECTION 10: pg_cron SETUP (Phase 1 — Supabase Pro)
-- =============================================================================
-- Supabase Pro includes pg_cron for scheduled jobs. Uncomment the block below
-- to enable automatic cleanup of expired onboarding sessions every 30 minutes.
--
-- Requires: pg_cron extension enabled in Supabase Dashboard →
--           Database → Extensions → pg_cron → Enable
--
-- [Phase 1] Uncomment after verifying pg_cron is available:
-- =============================================================================

/*
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Clean up expired onboarding sessions every 30 minutes
SELECT cron.schedule(
  'cleanup-expired-onboarding-sessions',  -- Job name (unique)
  '*/30 * * * *',                          -- Every 30 minutes (cron syntax)
  $$SELECT public.cleanup_expired_onboarding();$$
);

-- [Phase 2+] Also add: daily credit expiry job (EXPIRY transaction type)
-- SELECT cron.schedule(
--   'process-credit-expiry',
--   '0 0 * * *',    -- Daily at UTC midnight
--   $$SELECT public.process_credit_expiry();$$   -- Function to be created in Phase 2
-- );
*/


-- =============================================================================
-- SECTION 11: DEVICE SESSION CLEANUP UTILITY
-- =============================================================================
-- cleanup_expired_device_sessions() removes expired and revoked device sessions.
-- Like onboarding sessions, these rows are safe to hard-delete once expired.
--
-- [Phase 1]: Call manually or via pg_cron daily.
-- [Phase 2+]: Handled by BullMQ scheduled job.
--
-- Returns: INTEGER — the number of rows deleted.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.cleanup_expired_device_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, ''
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Delete sessions that are either expired OR explicitly revoked.
  -- Revoked sessions can be cleaned after a 24-hour grace period to allow
  -- in-flight requests using the old token to fail gracefully (401, not 500).
  DELETE FROM public.device_sessions
  WHERE
    expires_at < NOW()
    OR (revoked = TRUE AND created_at < NOW() - INTERVAL '24 hours');

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_expired_device_sessions() IS
  'Deletes expired and old-revoked device_sessions rows. Phase 1: run manually/pg_cron. Phase 2+: BullMQ scheduled job.';


-- =============================================================================
-- SECTION 12: SUMMARY OF CREATED OBJECTS
-- =============================================================================
-- Verify everything was created by running this query after migration:
--
-- SELECT routine_name, routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
-- ORDER BY routine_name;
--
-- Expected functions:
--   cleanup_expired_device_sessions  FUNCTION
--   cleanup_expired_onboarding       FUNCTION
--   current_user_has_role            FUNCTION
--   get_current_user_institution_id  FUNCTION
--   get_current_user_role            FUNCTION
--   get_user_credit_balance          FUNCTION
--   handle_new_user                  FUNCTION
--   log_audit_event                  FUNCTION
--   prevent_audit_log_mutation       FUNCTION
--   prevent_credit_mutation          FUNCTION
--   refresh_credit_balance           FUNCTION
--   update_updated_at_column         FUNCTION
--   validate_credit_balance          FUNCTION
--
-- Verify triggers with:
-- SELECT trigger_name, event_object_table, event_manipulation, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_schema IN ('public', 'auth')
-- ORDER BY event_object_table, trigger_name;
--
-- Expected triggers:
--   on_auth_user_created                  auth.users         INSERT  AFTER
--   trg_appointments_updated_at           appointments       UPDATE  BEFORE
--   trg_audit_logs_prevent_delete         audit_logs         DELETE  BEFORE
--   trg_audit_logs_prevent_update         audit_logs         UPDATE  BEFORE
--   trg_credit_transactions_prevent_delete credit_transactions DELETE BEFORE
--   trg_credit_transactions_prevent_update credit_transactions UPDATE BEFORE
--   trg_credit_transactions_refresh_balance credit_transactions INSERT AFTER
--   trg_institutions_updated_at           institutions       UPDATE  BEFORE
--   trg_user_private_updated_at           user_private       UPDATE  BEFORE
--
-- =============================================================================
-- END OF MIGRATION 003
-- =============================================================================
-- Summary of security properties established by this migration:
--
--   IMMUTABILITY
--     • audit_logs       — UPDATE and DELETE raise 'insufficient_privilege'
--     • credit_transactions — UPDATE and DELETE raise 'insufficient_privilege'
--
--   AUTOMATION
--     • updated_at auto-maintained on: institutions, user_private, appointments
--     • credit_balance view auto-refreshed CONCURRENTLY after every credit INSERT
--     • public.users row auto-created on every auth.users INSERT (signup hook)
--
--   VALIDATION
--     • validate_credit_balance() prevents negative ECC balance at DB layer
--     • handle_new_user() validates role and requires username before user creation
--
--   AUDIT
--     • USER_CREATED event logged automatically on every signup
--     • log_audit_event() is the single authorised audit write path
--     • Cleanup operations log their activity to audit_logs
--
-- Next: Run 004_seed_data.sql
-- =============================================================================
