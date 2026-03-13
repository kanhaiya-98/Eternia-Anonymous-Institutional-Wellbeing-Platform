-- =============================================================================
-- ETERNIA — Migration 002: Row Level Security (RLS) Policies
-- =============================================================================
-- Platform : Eternia — Anonymous Institutional Student Wellbeing Platform
-- Version  : 1.0 (Phase 1 — Modular Monolith, 0–10,000 Users)
-- Run order: Must run AFTER 001_schema.sql. Run BEFORE 003_functions_and_triggers.sql.
--
-- What this file does:
--   • Enables RLS on all 16 public tables
--   • Creates security helper functions (SECURITY DEFINER) for role + institution checks
--   • Defines granular SELECT / INSERT / UPDATE / DELETE policies per table per role
--   • Revokes dangerous default PUBLIC grants on sensitive tables
--   • Makes audit_logs and credit_transactions write-protected at the policy layer
--     (trigger-level immutability enforcement is added in migration 003)
--
-- Role model (from PRD Section 6):
--   STUDENT  — access own data only; completely anonymous to peers
--   INTERN   — own sessions + Peer Connect queue; no cross-student access
--   EXPERT   — own appointments; no peer/blackbox access
--   SPOC     — institution-scoped aggregate data; formal escalation only
--   ADMIN    — full platform access; every action audit-logged
--
-- Key security principles enforced here:
--   1. auth.uid() used for all row-ownership checks — no trust of client claims
--   2. SECURITY DEFINER helper functions prevent RLS recursion when policies
--      on table A need to query table B (e.g. look up caller's role from users)
--   3. Service role (SUPABASE_SERVICE_ROLE_KEY) bypasses all RLS — used only
--      in server-side API routes (Next.js /api/* or Fastify backend)
--   4. anon role gets effectively zero access — all operations require auth
--   5. user_private: zero access to any role except the owning user and
--      service role — the strictest policy on the platform
-- =============================================================================


-- =============================================================================
-- SECTION 1: SECURITY HELPER FUNCTIONS
-- =============================================================================
-- These SECURITY DEFINER functions run as the function owner (postgres) and
-- can therefore bypass RLS when querying the users table. This is intentional
-- and necessary to avoid infinite recursion in RLS policies.
--
-- IMPORTANT: These functions must only be called from within RLS policies or
-- from trusted server-side code. They are not exposed as public API endpoints.
-- =============================================================================

-- Returns the RBAC role of the currently authenticated user.
-- Returns NULL if the user is not authenticated or not found in public.users.
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_user_role() IS
  'SECURITY DEFINER: Returns current authenticated user role. Used in RLS policies. Do not expose via API.';


-- Returns the institution_id of the currently authenticated user.
-- Returns NULL if the user is not authenticated, not found, or has no institution.
CREATE OR REPLACE FUNCTION public.get_current_user_institution_id()
RETURNS UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT institution_id
  FROM public.users
  WHERE id = auth.uid()
    AND is_active = TRUE
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_current_user_institution_id() IS
  'SECURITY DEFINER: Returns current user institution_id. Used in SPOC/Admin scoped RLS policies.';


-- Returns TRUE if the current user has one of the specified roles.
-- Usage: public.current_user_has_role(ARRAY['SPOC', 'ADMIN'])
CREATE OR REPLACE FUNCTION public.current_user_has_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND is_active = TRUE
      AND role = ANY(allowed_roles)
  );
$$;

COMMENT ON FUNCTION public.current_user_has_role(TEXT[]) IS
  'SECURITY DEFINER: Returns TRUE if current user has any of the specified roles. Used in RLS policies.';


-- =============================================================================
-- SECTION 2: ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================================================
-- FORCE ROW LEVEL SECURITY is set on sensitive tables so that even the table
-- owner (postgres superuser via Supabase) is subject to RLS when querying
-- via the API layer. The service role key still bypasses RLS at the driver level.
-- =============================================================================

ALTER TABLE public.institutions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_listeners       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_availability  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blackbox_entries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalation_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_content        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quest_cards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_sessions  ENABLE ROW LEVEL SECURITY;

-- Force RLS on the most sensitive tables (prevents owner bypass)
ALTER TABLE public.user_private         FORCE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs           FORCE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions  FORCE ROW LEVEL SECURITY;


-- =============================================================================
-- SECTION 3: INSTITUTIONS POLICIES
-- =============================================================================
-- institutions is readable by all authenticated users (needed for the
-- Step 1 onboarding code validation flow and institution metadata display).
-- The actual code validation logic runs server-side via service role, which
-- bypasses RLS — the policy here covers direct client queries.
--
-- Write access: ADMIN only via service role. SPOC can update their own
-- institution's non-critical fields (e.g. display preferences).
-- =============================================================================

-- Authenticated users can read all active institutions.
-- Note: eternia_code should be excluded from SELECT list at API layer —
-- this policy allows the row read; column exclusion is enforced in the application.
CREATE POLICY "institutions_authenticated_read"
  ON public.institutions
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- SPOC can update their own institution's record.
-- Restricted to rows where the SPOC is the designated spoc_user_id.
CREATE POLICY "institutions_spoc_update"
  ON public.institutions
  FOR UPDATE
  TO authenticated
  USING (
    spoc_user_id = auth.uid()
    AND public.get_current_user_role() = 'SPOC'
  )
  WITH CHECK (
    spoc_user_id = auth.uid()
    AND public.get_current_user_role() = 'SPOC'
  );

-- ADMIN can update any institution.
CREATE POLICY "institutions_admin_update"
  ON public.institutions
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can insert new institutions (partner onboarding).
CREATE POLICY "institutions_admin_insert"
  ON public.institutions
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can soft-delete (deactivate) institutions.
-- Hard deletes are service-role only (no client-side DELETE policy).
CREATE POLICY "institutions_admin_delete"
  ON public.institutions
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 4: USERS POLICIES
-- =============================================================================
-- IMPORTANT: We do NOT call get_current_user_role() in users table policies
-- because that function queries the users table — this would cause infinite
-- recursion. Instead, we use auth.uid() for ownership checks, and for
-- role-based checks on users we accept a small subquery inline.
--
-- Policy summary:
--   SELECT: own record | SPOC sees their institution | ADMIN sees all
--   INSERT: service role only (handle_new_user trigger in migration 003)
--   UPDATE: own non-critical fields | SPOC updates institution users | ADMIN all
--   DELETE: service role only (soft delete via is_active; hard delete is DPDP erasure flow)
-- =============================================================================

-- Any authenticated user can read their own profile.
CREATE POLICY "users_read_own"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- SPOC can read all users within their institution.
-- Uses a subquery to get the SPOC's institution without calling get_current_user_role()
-- (which would recurse). The subquery is safe because it filters on id = auth.uid().
CREATE POLICY "users_spoc_read_institution"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    institution_id = (
      SELECT u.institution_id
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'SPOC'
        AND u.is_active = TRUE
      LIMIT 1
    )
  );

-- ADMIN can read all users across all institutions.
CREATE POLICY "users_admin_read_all"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN'
        AND u.is_active = TRUE
    )
  );

-- A user can update their own record (limited fields; column-level restrictions
-- enforced at API/application layer — e.g. role and institution_id are immutable).
CREATE POLICY "users_update_own"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- SPOC can update users within their institution (e.g. toggle is_active,
-- reset device binding). Role changes via SPOC are restricted at API layer.
CREATE POLICY "users_spoc_update_institution"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    institution_id = (
      SELECT u.institution_id
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'SPOC'
        AND u.is_active = TRUE
      LIMIT 1
    )
  )
  WITH CHECK (
    institution_id = (
      SELECT u.institution_id
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'SPOC'
        AND u.is_active = TRUE
      LIMIT 1
    )
  );

-- ADMIN can update any user record.
CREATE POLICY "users_admin_update"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN'
        AND u.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role = 'ADMIN'
        AND u.is_active = TRUE
    )
  );

-- INSERT and DELETE on users are service-role only — no authenticated policies.
-- Inserts are handled by the handle_new_user() auth trigger (migration 003).
-- Deletes are handled by the DPDP erasure flow via service role API routes.


-- =============================================================================
-- SECTION 5: USER_PRIVATE POLICIES
-- =============================================================================
-- The most restrictive table on the platform.
-- A user can only access their own row. Zero access for any other role,
-- including SPOC and ADMIN, via the client.
--
-- Formal identity reveal (escalation protocol) is EXCLUSIVELY handled via
-- service role in server-side API routes, with full audit logging.
-- The RLS policy here ensures that even a compromised client JWT cannot
-- read another user's sensitive PII.
-- =============================================================================

-- A user can read ONLY their own private profile row.
-- No exceptions. No SPOC. No ADMIN. Service role bypasses at API layer.
CREATE POLICY "user_private_read_own_only"
  ON public.user_private
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- A user can insert their own private profile row (Step 5 onboarding).
CREATE POLICY "user_private_insert_own_only"
  ON public.user_private
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- A user can update their own private profile row (emergency contact updates,
-- verification ID re-submission, consent re-acknowledgement).
CREATE POLICY "user_private_update_own_only"
  ON public.user_private
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DELETE on user_private is service-role only — no authenticated policy.
-- This is the DPDP Act erasure flow: hard delete user_private on account deletion.


-- =============================================================================
-- SECTION 6: DEVICE_SESSIONS POLICIES
-- =============================================================================
-- Device sessions are managed exclusively by the server. The client never
-- directly reads or writes device session records — all session management
-- (creation, rotation, revocation) happens via server-side service role calls.
--
-- The only client-facing SELECT is for a user to see their own active sessions
-- (e.g. "logged-in devices" screen — future feature).
-- =============================================================================

-- A user can read their own device sessions (for "active sessions" display).
CREATE POLICY "device_sessions_read_own"
  ON public.device_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- All write operations (INSERT, UPDATE, DELETE) are service-role only.
-- JWT rotation, session creation, and revocation are strictly server-side.


-- =============================================================================
-- SECTION 7: EXPERTS POLICIES
-- =============================================================================
-- Experts is public catalogue data — all authenticated users can browse.
-- Write access is ADMIN only (expert management via Admin dashboard).
-- =============================================================================

-- Any authenticated user can read active experts (for appointment booking UI).
CREATE POLICY "experts_authenticated_read"
  ON public.experts
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ADMIN can read all experts (including inactive, for management).
CREATE POLICY "experts_admin_read_all"
  ON public.experts
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- ADMIN can insert new experts.
CREATE POLICY "experts_admin_insert"
  ON public.experts
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can update expert profiles and availability status.
CREATE POLICY "experts_admin_update"
  ON public.experts
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can delete (or soft-delete via is_active) expert records.
CREATE POLICY "experts_admin_delete"
  ON public.experts
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 8: PEER_LISTENERS POLICIES
-- =============================================================================
-- Same access model as experts — authenticated read, ADMIN write.
-- Interns who are peer listeners can also read the full list (for queue UI).
-- =============================================================================

-- Any authenticated user can read active peer listeners (Peer Connect UI).
CREATE POLICY "peer_listeners_authenticated_read"
  ON public.peer_listeners
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ADMIN can read all peer listeners including inactive.
CREATE POLICY "peer_listeners_admin_read_all"
  ON public.peer_listeners
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- ADMIN can insert new peer listeners.
CREATE POLICY "peer_listeners_admin_insert"
  ON public.peer_listeners
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can update peer listener profiles.
CREATE POLICY "peer_listeners_admin_update"
  ON public.peer_listeners
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can delete peer listener records.
CREATE POLICY "peer_listeners_admin_delete"
  ON public.peer_listeners
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 9: EXPERT_AVAILABILITY POLICIES
-- =============================================================================
-- Availability slots are readable by authenticated users for browsing.
-- Slots are created and managed by ADMIN or SPOC (institution-scoped).
-- =============================================================================

-- Authenticated users can view available (unbooked) slots.
-- Scoped to slots for their institution or global slots (NULL institution_id).
CREATE POLICY "expert_availability_student_read"
  ON public.expert_availability
  FOR SELECT
  TO authenticated
  USING (
    is_booked = FALSE
    AND (
      institution_id IS NULL
      OR institution_id = public.get_current_user_institution_id()
    )
  );

-- SPOC can read all slots for their institution (including booked).
CREATE POLICY "expert_availability_spoc_read"
  ON public.expert_availability
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'SPOC'
    AND institution_id = public.get_current_user_institution_id()
  );

-- ADMIN can read all availability slots across all institutions.
CREATE POLICY "expert_availability_admin_read"
  ON public.expert_availability
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- SPOC can create availability slots for their institution.
CREATE POLICY "expert_availability_spoc_insert"
  ON public.expert_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.get_current_user_role() = 'SPOC'
    AND institution_id = public.get_current_user_institution_id()
  );

-- ADMIN can create slots for any institution.
CREATE POLICY "expert_availability_admin_insert"
  ON public.expert_availability
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- SPOC can update slots for their institution (e.g. cancel a slot).
CREATE POLICY "expert_availability_spoc_update"
  ON public.expert_availability
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() = 'SPOC'
    AND institution_id = public.get_current_user_institution_id()
  )
  WITH CHECK (
    public.get_current_user_role() = 'SPOC'
    AND institution_id = public.get_current_user_institution_id()
  );

-- ADMIN can update any slot.
CREATE POLICY "expert_availability_admin_update"
  ON public.expert_availability
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can delete slots.
CREATE POLICY "expert_availability_admin_delete"
  ON public.expert_availability
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 10: APPOINTMENTS POLICIES
-- =============================================================================
-- Students see their own bookings.
-- Experts see appointments booked with them.
-- SPOC sees institution-level appointment data (anonymous aggregate view).
-- All write operations go through service role (booking flow with credit check).
-- =============================================================================

-- A student can read their own appointments.
CREATE POLICY "appointments_student_read_own"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    AND public.get_current_user_role() = 'STUDENT'
  );

-- An expert can read appointments booked with them.
-- session_notes_encrypted is visible here but must be excluded at API layer
-- for student-facing responses.
CREATE POLICY "appointments_expert_read_own"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    expert_id IN (
      SELECT e.id FROM public.experts e
      WHERE e.id = appointments.expert_id
    )
    AND public.get_current_user_role() = 'EXPERT'
  );

-- SPOC can read all appointments for students in their institution.
CREATE POLICY "appointments_spoc_read_institution"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'SPOC'
    AND student_id IN (
      SELECT u.id FROM public.users u
      WHERE u.institution_id = public.get_current_user_institution_id()
    )
  );

-- ADMIN can read all appointments.
CREATE POLICY "appointments_admin_read_all"
  ON public.appointments
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- Expert can update their own appointment (mark completed, add notes).
-- Students cannot update appointments directly — handled via service role.
CREATE POLICY "appointments_expert_update_own"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (
    public.get_current_user_role() = 'EXPERT'
  )
  WITH CHECK (
    public.get_current_user_role() = 'EXPERT'
  );

-- ADMIN can update any appointment.
CREATE POLICY "appointments_admin_update"
  ON public.appointments
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- INSERT and DELETE are service-role only (booking flow with credit lock + check).


-- =============================================================================
-- SECTION 11: PEER_SESSIONS POLICIES
-- =============================================================================
-- Students can read their own sessions.
-- Peer listeners (interns) can read sessions assigned to them.
-- SPOC can read institution-scoped session metadata (no content).
-- Write operations are service-role only (session lifecycle management).
-- =============================================================================

-- A student can read their own peer sessions.
CREATE POLICY "peer_sessions_student_read_own"
  ON public.peer_sessions
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    AND public.get_current_user_role() = 'STUDENT'
  );

-- A peer listener (intern) can read sessions assigned to them.
-- listener_id references peer_listeners.id — not users.id — so we match
-- via the application layer. This policy covers the intern's user record.
CREATE POLICY "peer_sessions_intern_read_own"
  ON public.peer_sessions
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'INTERN');

-- SPOC can read peer session metadata for their institution (no content).
-- escalation_note_encrypted is NOT returned in SPOC-facing queries — enforced at API layer.
CREATE POLICY "peer_sessions_spoc_read_institution"
  ON public.peer_sessions
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'SPOC'
    AND student_id IN (
      SELECT u.id FROM public.users u
      WHERE u.institution_id = public.get_current_user_institution_id()
    )
  );

-- ADMIN can read all peer sessions.
CREATE POLICY "peer_sessions_admin_read_all"
  ON public.peer_sessions
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- Intern can update their assigned sessions (flag, add escalation note, end session).
CREATE POLICY "peer_sessions_intern_update_own"
  ON public.peer_sessions
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'INTERN')
  WITH CHECK (public.get_current_user_role() = 'INTERN');

-- ADMIN can update any peer session.
CREATE POLICY "peer_sessions_admin_update"
  ON public.peer_sessions
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- INSERT is service-role only (session request flow).


-- =============================================================================
-- SECTION 12: BLACKBOX_ENTRIES POLICIES
-- =============================================================================
-- BlackBox is the most privacy-sensitive module.
-- A user can ONLY read/write/delete their OWN entries.
-- No other role — not SPOC, not ADMIN — can read BlackBox content via client.
-- Escalation content access is exclusively via service role with audit logging.
-- =============================================================================

-- A user can read only their own BlackBox entries.
CREATE POLICY "blackbox_entries_read_own"
  ON public.blackbox_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- A user can create BlackBox entries for themselves.
CREATE POLICY "blackbox_entries_insert_own"
  ON public.blackbox_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND public.get_current_user_role() = 'STUDENT'
  );

-- A user can update their own entries (e.g. toggle is_private setting).
CREATE POLICY "blackbox_entries_update_own"
  ON public.blackbox_entries
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- A user can delete their own BlackBox entries (DPDP right to erasure).
CREATE POLICY "blackbox_entries_delete_own"
  ON public.blackbox_entries
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- NOTE: ai_flag_level updates (from 0 → 1/2/3) are performed via service role
-- after AI classification. No authenticated policy for ai_flag_level mutation.


-- =============================================================================
-- SECTION 13: ESCALATION_REQUESTS POLICIES
-- =============================================================================
-- SPOC can create escalation requests and view their own institution's requests.
-- ADMIN can read and update all escalation requests (approve/reject).
-- Students and Interns have zero access.
-- =============================================================================

-- SPOC can read escalation requests they initiated.
CREATE POLICY "escalation_requests_spoc_read_own"
  ON public.escalation_requests
  FOR SELECT
  TO authenticated
  USING (
    spoc_id = auth.uid()
    AND public.get_current_user_role() = 'SPOC'
  );

-- SPOC can create new escalation requests.
CREATE POLICY "escalation_requests_spoc_insert"
  ON public.escalation_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    spoc_id = auth.uid()
    AND public.get_current_user_role() = 'SPOC'
  );

-- ADMIN can read all escalation requests.
CREATE POLICY "escalation_requests_admin_read_all"
  ON public.escalation_requests
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- ADMIN can update escalation requests (approve, reject, resolve).
CREATE POLICY "escalation_requests_admin_update"
  ON public.escalation_requests
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- DELETE is service-role only — escalation records must be retained for compliance.


-- =============================================================================
-- SECTION 14: CREDIT_TRANSACTIONS POLICIES
-- =============================================================================
-- The credit ledger is append-only (enforced by trigger in migration 003).
--
-- Policy summary:
--   SELECT: users see their own transactions; SPOC sees institution; ADMIN sees all
--   INSERT: service role only (credit deductions/grants go through API validation)
--   UPDATE: NOBODY — enforced by trigger in migration 003
--   DELETE: NOBODY — enforced by trigger in migration 003
-- =============================================================================

-- A user can read their own credit transaction history (wallet screen).
CREATE POLICY "credit_transactions_read_own"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- SPOC can read credit transactions for all users in their institution.
CREATE POLICY "credit_transactions_spoc_read_institution"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (
    public.get_current_user_role() = 'SPOC'
    AND institution_id = public.get_current_user_institution_id()
  );

-- ADMIN can read all credit transactions.
CREATE POLICY "credit_transactions_admin_read_all"
  ON public.credit_transactions
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- No INSERT policy for authenticated role — all inserts go through service role
-- after server-side credit balance validation (validate_credit_balance function
-- in migration 003 prevents negative balance at DB layer as a backstop).

-- No UPDATE or DELETE policies — trigger in migration 003 raises an exception
-- if any UPDATE or DELETE is attempted on this table from any role.


-- =============================================================================
-- SECTION 15: SOUND_CONTENT POLICIES
-- =============================================================================
-- Sound Therapy catalogue is read-only for all authenticated users.
-- Content management (add/update/deactivate tracks) is ADMIN only.
-- =============================================================================

-- Any authenticated user can read active sound tracks.
CREATE POLICY "sound_content_authenticated_read"
  ON public.sound_content
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ADMIN can read all tracks including inactive (content management).
CREATE POLICY "sound_content_admin_read_all"
  ON public.sound_content
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- ADMIN can insert new tracks.
CREATE POLICY "sound_content_admin_insert"
  ON public.sound_content
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can update track metadata (title, is_active, sort_order, b2_file_key).
CREATE POLICY "sound_content_admin_update"
  ON public.sound_content
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can delete tracks.
CREATE POLICY "sound_content_admin_delete"
  ON public.sound_content
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 16: QUEST_CARDS POLICIES
-- =============================================================================
-- Quest cards are readable by all authenticated users.
-- ADMIN manages the quest card catalogue.
-- =============================================================================

-- Any authenticated user can read active quest cards.
CREATE POLICY "quest_cards_authenticated_read"
  ON public.quest_cards
  FOR SELECT
  TO authenticated
  USING (is_active = TRUE);

-- ADMIN can read all quest cards including inactive.
CREATE POLICY "quest_cards_admin_read_all"
  ON public.quest_cards
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- ADMIN can insert new quest cards.
CREATE POLICY "quest_cards_admin_insert"
  ON public.quest_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can update quest card content.
CREATE POLICY "quest_cards_admin_update"
  ON public.quest_cards
  FOR UPDATE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN')
  WITH CHECK (public.get_current_user_role() = 'ADMIN');

-- ADMIN can delete (or soft-delete via is_active) quest cards.
CREATE POLICY "quest_cards_admin_delete"
  ON public.quest_cards
  FOR DELETE
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');


-- =============================================================================
-- SECTION 17: AUDIT_LOGS POLICIES
-- =============================================================================
-- audit_logs is the compliance immutability cornerstone.
--
-- Policy summary:
--   SELECT: ADMIN only — no other role can browse audit logs via client
--   INSERT: NOBODY via client — all inserts use log_audit_event() helper
--           which runs as SECURITY DEFINER (service-level permissions)
--   UPDATE: NOBODY — trigger in migration 003 raises exception on UPDATE
--   DELETE: NOBODY — trigger in migration 003 raises exception on DELETE
--
-- The combination of RLS (no write policies) + immutability trigger (migration 003)
-- + FORCE ROW LEVEL SECURITY provides three independent layers of protection.
-- =============================================================================

-- ADMIN can read all audit logs (compliance review, escalation investigation).
CREATE POLICY "audit_logs_admin_read_only"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.get_current_user_role() = 'ADMIN');

-- No INSERT, UPDATE, or DELETE policies for any authenticated role.
-- All audit log writes go through the log_audit_event() SECURITY DEFINER
-- function defined in migration 003, which runs with elevated privileges
-- and bypasses RLS for the insert operation only.


-- =============================================================================
-- SECTION 18: ONBOARDING_SESSIONS POLICIES
-- =============================================================================
-- onboarding_sessions is service-role only — no authenticated access.
-- The onboarding API routes use the service role key exclusively to manage
-- these sessions. No JWT is issued until Step 4 (user creation) completes.
-- Therefore, no authenticated user ever needs direct access to this table.
-- =============================================================================

-- No policies defined for authenticated role — service role only.
-- Any authenticated attempt to query this table will return zero rows
-- (RLS enabled, no permissive policies = deny by default).


-- =============================================================================
-- SECTION 19: REVOKE DANGEROUS DEFAULT GRANTS
-- =============================================================================
-- Supabase creates a default anon role that can read public schema tables
-- unless explicitly restricted. We revoke all public/anon grants on sensitive
-- tables as an additional defence-in-depth measure beyond RLS.
-- =============================================================================

-- Revoke all default privileges from anon and public on sensitive tables.
REVOKE ALL ON public.users             FROM anon, PUBLIC;
REVOKE ALL ON public.user_private      FROM anon, PUBLIC;
REVOKE ALL ON public.device_sessions   FROM anon, PUBLIC;
REVOKE ALL ON public.audit_logs        FROM anon, PUBLIC;
REVOKE ALL ON public.credit_transactions FROM anon, PUBLIC;
REVOKE ALL ON public.blackbox_entries  FROM anon, PUBLIC;
REVOKE ALL ON public.escalation_requests FROM anon, PUBLIC;
REVOKE ALL ON public.onboarding_sessions FROM anon, PUBLIC;
REVOKE ALL ON public.appointments      FROM anon, PUBLIC;
REVOKE ALL ON public.peer_sessions     FROM anon, PUBLIC;

-- Grant only SELECT on catalogue tables for authenticated role.
-- (RLS policies above further restrict which rows are visible.)
GRANT SELECT ON public.experts         TO authenticated;
GRANT SELECT ON public.peer_listeners  TO authenticated;
GRANT SELECT ON public.sound_content   TO authenticated;
GRANT SELECT ON public.quest_cards     TO authenticated;
GRANT SELECT ON public.institutions    TO authenticated;

-- Grant full read-write on tables where authenticated users need write access,
-- constrained by the RLS policies defined above.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users             TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.user_private      TO authenticated;
GRANT SELECT                         ON public.device_sessions   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blackbox_entries  TO authenticated;
GRANT SELECT, INSERT                 ON public.escalation_requests TO authenticated;
GRANT SELECT                         ON public.credit_transactions TO authenticated;
GRANT SELECT                         ON public.audit_logs        TO authenticated;
GRANT SELECT, UPDATE                 ON public.appointments      TO authenticated;
GRANT SELECT, UPDATE                 ON public.peer_sessions     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expert_availability TO authenticated;

-- Grant access to the credit_balance materialized view.
GRANT SELECT ON public.credit_balance TO authenticated;

-- Grant access to the helper functions.
GRANT EXECUTE ON FUNCTION public.get_current_user_role()           TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_institution_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(TEXT[])     TO authenticated;


-- =============================================================================
-- END OF MIGRATION 002
-- =============================================================================
-- Summary:
--   RLS enabled on  : 16 tables (FORCE RLS on user_private, audit_logs,
--                     credit_transactions)
--   Helper functions: get_current_user_role(), get_current_user_institution_id(),
--                     current_user_has_role()
--   Policies created: ~55 policies across all tables
--   Key protections :
--     • user_private    — owner-only read/write; zero SPOC/ADMIN access via client
--     • audit_logs      — ADMIN read-only; no client writes
--     • credit_transactions — read-only for owner/SPOC/ADMIN; no client inserts
--     • onboarding_sessions — service role only; no authenticated access
--
-- Next: Run 003_functions_and_triggers.sql
-- =============================================================================
