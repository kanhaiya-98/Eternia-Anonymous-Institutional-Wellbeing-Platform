-- =============================================================================
-- ETERNIA — Migration 001: Database Schema
-- =============================================================================
-- Platform : Eternia — Anonymous Institutional Student Wellbeing Platform
-- Version  : 1.0 (Phase 1 — Modular Monolith, 0–10,000 Users)
-- Target DB: PostgreSQL 15 via Supabase Pro (Mumbai region — DPDP Act compliant)
-- Run order: This MUST be the first migration executed.
--
-- What this file creates:
--   • All core domain tables (17 tables)
--   • 1 materialized view (credit_balance)
--   • All required indexes per PRD Section 12.3
--   • Unique constraints and check constraints
--
-- Phase notes:
--   [Phase 1]  — Active in current deployment
--   [Phase 2+] — Noted where schema supports future features not yet activated
--
-- IMPORTANT: All PII fields marked _encrypted are stored as AES-256-GCM
-- ciphertext. Encryption/decryption is performed in the application layer
-- (Node.js crypto module) — never in this database. Do not attempt to
-- read or decode these columns directly.
-- =============================================================================

-- Enable pgcrypto extension for gen_random_uuid() — required on Supabase
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enable pg_trgm for full-text search on expert/content names [Phase 1]
CREATE EXTENSION IF NOT EXISTS pg_trgm;


-- =============================================================================
-- SECTION 1: INSTITUTIONS
-- =============================================================================
-- Represents partner institutions (colleges, universities, schools) that have
-- signed an agreement with Eternia and received an Eternia Code.
--
-- Phase 1 note: eternia_code is stored as plain text for development ease.
--              In Phase 2+, this must be migrated to an HMAC-SHA256 hash
--              (one-way) with the plaintext code never stored server-side.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.institutions (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT         NOT NULL,

  -- [Phase 1] Plain text for development. [Phase 2] Replace with HMAC-SHA256 hash.
  -- The hash comparison must use constant-time equality to prevent timing attacks.
  eternia_code     TEXT         UNIQUE NOT NULL,

  -- The SPOC (Single Point of Contact / Grievance Officer) for this institution.
  -- Set after the SPOC user account is created. FK added after users table exists.
  spoc_user_id     UUID,

  -- Subscription tier: basic | pro | enterprise
  -- Controls credit pool size, session quotas, and feature access.
  plan_type        TEXT         NOT NULL DEFAULT 'basic'
                   CHECK (plan_type IN ('basic', 'pro', 'enterprise')),

  -- Total credits allocated to this institution's pool.
  -- Distributed to students by the SPOC via the credit grant mechanism.
  credits_pool     INTEGER      NOT NULL DEFAULT 0
                   CHECK (credits_pool >= 0),

  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.institutions               IS 'Partner institutions with active Eternia agreements.';
COMMENT ON COLUMN public.institutions.eternia_code  IS '[Phase 1] Plain text code. [Phase 2+] Store as HMAC-SHA256 hash — plaintext never persisted.';
COMMENT ON COLUMN public.institutions.credits_pool  IS 'Total ECC credits purchased/allocated to this institution. Distributed to students by SPOC.';
COMMENT ON COLUMN public.institutions.spoc_user_id  IS 'FK to users.id — set after SPOC user account is created.';


-- =============================================================================
-- SECTION 2: USERS
-- =============================================================================
-- Extends Supabase auth.users. One row per authenticated user.
-- The Supabase Auth user (auth.users) is created first; this row is inserted
-- via the handle_new_user() trigger defined in migration 003.
--
-- Anonymity model: `username` is the ONLY identity visible to other users.
-- No real name, email, or phone is stored in this table.
-- The fake email used for Supabase Auth ({username}@eternia.app) is stored
-- only in auth.users, not here.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  -- Must match the corresponding auth.users.id exactly.
  id                    UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  institution_id        UUID         REFERENCES public.institutions(id) ON DELETE RESTRICT,

  -- Self-chosen during onboarding Step 4. Visible to interns/experts during
  -- sessions. Never a real name. Unique within institution scope.
  username              TEXT         NOT NULL,

  -- RBAC role. Immutable by the user — only Admin or SPOC can change.
  role                  TEXT         NOT NULL DEFAULT 'STUDENT'
                        CHECK (role IN ('STUDENT', 'INTERN', 'EXPERT', 'SPOC', 'ADMIN')),

  -- AES-256-GCM encrypted device fingerprint (composite of device UUID,
  -- OS version hash, manufacturer hash). Used for crisis traceability only —
  -- never exposed in any peer-facing or public API response.
  device_id_encrypted   TEXT,

  is_active             BOOLEAN      NOT NULL DEFAULT TRUE,

  -- APAAR (ABC ID) verification status — for university/college students.
  -- Set to TRUE by the backend after successful institutional verification.
  apaar_verified        BOOLEAN      NOT NULL DEFAULT FALSE,

  -- ERP ID verification status — for school students.
  -- Set to TRUE by the backend after successful ERP verification.
  erp_verified          BOOLEAN      NOT NULL DEFAULT FALSE,

  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  last_login            TIMESTAMPTZ,

  -- Username is unique within an institution, but the same username can exist
  -- across different institutions (e.g., "alex" at two different colleges).
  UNIQUE (institution_id, username)
);

COMMENT ON TABLE  public.users                      IS 'Core user records. Extends auth.users. Anonymity-preserving: no PII stored here.';
COMMENT ON COLUMN public.users.username             IS 'Self-chosen anonymous identifier. Unique per institution. The only identity visible to peers.';
COMMENT ON COLUMN public.users.device_id_encrypted  IS 'AES-256-GCM encrypted device fingerprint. For internal crisis traceability only. Never returned via API.';
COMMENT ON COLUMN public.users.role                 IS 'RBAC role: STUDENT | INTERN | EXPERT | SPOC | ADMIN. Immutable by user — Admin/SPOC only.';


-- Add the deferred FK from institutions back to users (SPOC relationship)
ALTER TABLE public.institutions
  ADD CONSTRAINT fk_institutions_spoc_user
  FOREIGN KEY (spoc_user_id) REFERENCES public.users(id) ON DELETE SET NULL
  DEFERRABLE INITIALLY DEFERRED;


-- =============================================================================
-- SECTION 3: USER_PRIVATE
-- =============================================================================
-- Stores Sensitive Personal Data (SPD) under DPDP Act 2023.
-- ALL fields in this table are AES-256-GCM encrypted before DB write.
-- This table has the most restrictive RLS policy on the platform:
--   - Only the owning user can read/update their own row via the app.
--   - Formal escalation (Admin only, fully audited) is the only exception.
--   - Dashboard queries MUST NOT JOIN this table.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_private (
  -- 1:1 with users — same UUID as primary key
  user_id                     UUID         PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,

  -- [Phase 1] University/college students — APAAR/ABC ID encrypted.
  -- Raw value discarded from memory immediately after encryption.
  apaar_id_encrypted          TEXT,

  -- [Phase 1] School students — ERP/admission ID encrypted.
  -- Raw value discarded from memory immediately after encryption.
  erp_id_encrypted            TEXT,

  -- Emergency contact details — collected during onboarding Step 5.
  -- AES-256-GCM encrypted. Write-only from application perspective.
  -- NEVER returned in any API response under normal operation.
  emergency_name_encrypted    TEXT,
  emergency_phone_encrypted   TEXT,
  emergency_relation_encrypted TEXT,  -- Relationship to emergency contact (if not self)

  -- Whether the emergency contact number belongs to the student themselves
  -- or to another individual (e.g., parent, guardian).
  emergency_ownership         TEXT
                              CHECK (emergency_ownership IN ('self', 'other')),

  -- DPDP Act consent: student explicitly acknowledged the escalation consent
  -- statement during Step 5 onboarding. Required before collecting PII.
  escalation_consent          BOOLEAN      NOT NULL DEFAULT FALSE,
  consent_timestamp           TIMESTAMPTZ,  -- Stored per DPDP Act consent logging requirement

  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.user_private IS 'Sensitive Personal Data (DPDP Act 2023). ALL fields AES-256-GCM encrypted. Strictest RLS on platform. Write-only from app perspective.';
COMMENT ON COLUMN public.user_private.apaar_id_encrypted           IS 'APAAR/ABC ID — university/college students only. Encrypted. Raw value never stored.';
COMMENT ON COLUMN public.user_private.erp_id_encrypted             IS 'ERP/admission ID — school students only. Encrypted. Raw value never stored.';
COMMENT ON COLUMN public.user_private.emergency_name_encrypted     IS 'Emergency contact name. AES-256-GCM. Never returned via API.';
COMMENT ON COLUMN public.user_private.emergency_phone_encrypted    IS 'Emergency contact phone. AES-256-GCM. Revealed only under formal escalation protocol.';
COMMENT ON COLUMN public.user_private.emergency_relation_encrypted IS 'Relationship to emergency contact. Required when emergency_ownership = other.';
COMMENT ON COLUMN public.user_private.escalation_consent           IS 'DPDP Act: explicit consent for crisis escalation notification. Must be TRUE before PII is stored.';
COMMENT ON COLUMN public.user_private.consent_timestamp            IS 'Timestamp of consent acknowledgement. Stored per DPDP Act Section 6 requirements.';


-- =============================================================================
-- SECTION 4: DEVICE SESSIONS
-- =============================================================================
-- Tracks device-bound refresh token sessions.
-- Used for JWT refresh token rotation — old token is invalidated on every
-- refresh cycle (rotating refresh tokens, per security requirement #4).
-- A revoked or expired session forces re-authentication.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.device_sessions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- SHA-256 hash of the device fingerprint (not the encrypted version).
  -- Used for device validation on every authenticated API request.
  device_id_hash      TEXT         NOT NULL,

  -- SHA-256 hash of the current valid refresh token.
  -- On token rotation: old hash deleted, new hash stored. One-way only.
  refresh_token_hash  TEXT,

  expires_at          TIMESTAMPTZ  NOT NULL,
  revoked             BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.device_sessions IS 'Device-bound JWT refresh token sessions. Implements rotating refresh token security model.';
COMMENT ON COLUMN public.device_sessions.device_id_hash     IS 'SHA-256 of device fingerprint. Validated on every authenticated request.';
COMMENT ON COLUMN public.device_sessions.refresh_token_hash IS 'SHA-256 of active refresh token. Old token invalidated on every rotation.';
COMMENT ON COLUMN public.device_sessions.revoked            IS 'TRUE = session forcibly terminated (logout, device reset, admin action).';


-- =============================================================================
-- SECTION 5: EXPERTS
-- =============================================================================
-- Verified mental health professionals (institutional counsellors or
-- Eternia-partnered psychologists). Seeded in migration 004.
-- This is reference/catalogue data — public read for authenticated users.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.experts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT         NOT NULL,
  specialization   TEXT         NOT NULL,
  experience       TEXT         NOT NULL,                     -- e.g. "10+ years"
  rating           DECIMAL(2,1) NOT NULL DEFAULT 4.5
                   CHECK (rating >= 0.0 AND rating <= 5.0),
  availability     TEXT         NOT NULL DEFAULT 'Available', -- Human-readable availability label
  initials         TEXT         NOT NULL,                     -- Display avatar initials (e.g. "PS")
  bio              TEXT,
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.experts             IS 'Verified mental health professionals available for appointment booking.';
COMMENT ON COLUMN public.experts.initials    IS 'Two-letter initials for avatar display in the app UI.';
COMMENT ON COLUMN public.experts.is_active   IS 'Soft delete / availability toggle. Inactive experts do not appear in booking UI.';


-- =============================================================================
-- SECTION 6: PEER LISTENERS
-- =============================================================================
-- Trained psychology interns who facilitate Peer Connect sessions.
-- Interns must complete the mandatory training program before gaining
-- access to live sessions (training_status enforced at application layer).
-- Seeded in migration 004.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.peer_listeners (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT         NOT NULL,
  specialization      TEXT         NOT NULL,
  sessions_completed  INTEGER      NOT NULL DEFAULT 0
                      CHECK (sessions_completed >= 0),
  rating              DECIMAL(2,1) NOT NULL DEFAULT 4.5
                      CHECK (rating >= 0.0 AND rating <= 5.0),
  availability        TEXT         NOT NULL DEFAULT 'Available',
  initials            TEXT         NOT NULL,
  is_good_listener    BOOLEAN      NOT NULL DEFAULT TRUE,      -- Training badge / quality indicator
  bio                 TEXT,
  is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.peer_listeners                IS 'Trained psychology interns for Peer Connect sessions. Must complete training before live session access.';
COMMENT ON COLUMN public.peer_listeners.is_good_listener IS 'Training completion badge. Only TRUE after Admin approves intern after Day 7 interview.';


-- =============================================================================
-- SECTION 7: EXPERT AVAILABILITY
-- =============================================================================
-- Slot management for expert appointment booking.
-- Slots are defined by SPOC/Admin via the dashboard.
-- Students browse available slots and initiate bookings via the Care Credits system.
--
-- [Phase 2+] recurrence_rule supports iCal RRULE format for recurring weekly slots.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.expert_availability (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id        UUID         NOT NULL REFERENCES public.experts(id) ON DELETE CASCADE,

  -- NULL institution_id = slot available to all institutions (global expert).
  -- Non-null = slot restricted to a specific institution's students.
  institution_id   UUID         REFERENCES public.institutions(id) ON DELETE CASCADE,

  start_time       TIMESTAMPTZ  NOT NULL,
  end_time         TIMESTAMPTZ  NOT NULL,
  is_booked        BOOLEAN      NOT NULL DEFAULT FALSE,

  -- [Phase 2+] iCal RRULE string for recurring availability (e.g. weekly slots).
  -- NULL in Phase 1 — slots are created individually.
  recurrence_rule  TEXT,

  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Ensure end_time is always after start_time
  CONSTRAINT chk_expert_availability_times CHECK (end_time > start_time)
);

COMMENT ON TABLE  public.expert_availability                IS 'Bookable time slots for expert sessions. Managed via SPOC/Admin dashboard.';
COMMENT ON COLUMN public.expert_availability.institution_id IS 'NULL = global slot for any institution. Non-null = restricted to one institution.';
COMMENT ON COLUMN public.expert_availability.recurrence_rule IS '[Phase 2+] iCal RRULE for recurring slots. NULL in Phase 1.';


-- =============================================================================
-- SECTION 8: APPOINTMENTS
-- =============================================================================
-- Booked expert sessions. Created when a student selects a slot and the
-- system confirms credit deduction. The slot is held for 15 minutes during
-- the booking flow to prevent double-booking.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id                       UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id               UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  expert_id                UUID         REFERENCES public.experts(id) ON DELETE SET NULL,
  slot_time                TIMESTAMPTZ  NOT NULL,
  session_type             TEXT         NOT NULL DEFAULT 'video'
                           CHECK (session_type IN ('video', 'audio', 'chat')),
  status                   TEXT         NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  credits_charged          INTEGER      NOT NULL DEFAULT 0
                           CHECK (credits_charged >= 0),

  -- AES-256-GCM encrypted session notes written by expert post-session.
  -- Never returned in student-facing API responses.
  session_notes_encrypted  TEXT,

  completed_at             TIMESTAMPTZ,
  created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.appointments                         IS 'Expert appointment bookings. Created after successful credit reservation.';
COMMENT ON COLUMN public.appointments.session_notes_encrypted IS 'AES-256-GCM expert notes post-session. Expert-only access via service role.';
COMMENT ON COLUMN public.appointments.credits_charged         IS 'ECC credits deducted from student wallet on booking confirmation.';


-- =============================================================================
-- SECTION 9: PEER SESSIONS
-- =============================================================================
-- Real-time anonymous peer support sessions between students and
-- trained peer listeners (interns). Communication via Socket.IO rooms
-- keyed on session UUID — no personal identity in the room identifier.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.peer_sessions (
  id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id                  UUID         REFERENCES public.users(id) ON DELETE SET NULL,
  listener_id                 UUID         REFERENCES public.peer_listeners(id) ON DELETE SET NULL,
  connection_type             TEXT         NOT NULL DEFAULT 'chat'
                              CHECK (connection_type IN ('chat', 'voice')),
  started_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ended_at                    TIMESTAMPTZ,
  status                      TEXT         NOT NULL DEFAULT 'active'
                              CHECK (status IN ('active', 'completed', 'flagged', 'cancelled')),

  -- Set to TRUE by intern if session content requires escalation review.
  -- Does NOT break student anonymity — only session metadata is flagged.
  is_flagged                  BOOLEAN      NOT NULL DEFAULT FALSE,

  -- AES-256-GCM encrypted escalation note written by the intern.
  -- Visible only via service role during formal escalation process.
  escalation_note_encrypted   TEXT,

  credits_charged             INTEGER      NOT NULL DEFAULT 0
                              CHECK (credits_charged >= 0),
  created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.peer_sessions                           IS 'Anonymous Peer Connect sessions between students and trained interns.';
COMMENT ON COLUMN public.peer_sessions.is_flagged                IS 'Intern-triggered flag for escalation review. Does not expose student identity.';
COMMENT ON COLUMN public.peer_sessions.escalation_note_encrypted IS 'AES-256-GCM intern escalation note. Accessible only via service role under formal protocol.';


-- =============================================================================
-- SECTION 10: BLACKBOX ENTRIES
-- =============================================================================
-- The most sensitive module. Students express themselves anonymously.
-- Content is encrypted before storage. AI moderation runs on temporary
-- buffers — only flagged entries generate persistent records.
--
-- ai_flag_level:
--   0 = Normal — no action
--   1 = Monitor — logged for pattern analysis
--   2 = Alert — anonymous SPOC notification ("a student may need support")
--   3 = Escalation — formal identity reveal request protocol triggered
--
-- is_private = TRUE means the student has disabled AI scanning for this entry.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.blackbox_entries (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID         REFERENCES public.users(id) ON DELETE CASCADE,

  -- AES-256-GCM encrypted entry content. Encryption key is user-scoped.
  -- Raw content never stored. Never returned via any standard API response.
  content_encrypted   TEXT,

  content_type        TEXT         NOT NULL DEFAULT 'text'
                      CHECK (content_type IN ('text', 'voice')),

  -- AI risk classification level (0–3). See section comment above.
  ai_flag_level       INTEGER      NOT NULL DEFAULT 0
                      CHECK (ai_flag_level BETWEEN 0 AND 3),

  -- Student can mark entry as fully private to disable AI scanning.
  -- Institutions can configure whether this option is available.
  is_private          BOOLEAN      NOT NULL DEFAULT FALSE,

  -- Duration of the BlackBox session in seconds (for analytics).
  session_duration    INTEGER      NOT NULL DEFAULT 0
                      CHECK (session_duration >= 0),

  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.blackbox_entries                  IS 'Anonymous encrypted self-expression entries. The most privacy-sensitive table in the schema.';
COMMENT ON COLUMN public.blackbox_entries.content_encrypted IS 'AES-256-GCM. User-scoped encryption key. Raw content never persisted.';
COMMENT ON COLUMN public.blackbox_entries.ai_flag_level     IS '0=Normal, 1=Monitor, 2=Alert SPOC (anonymous), 3=Formal escalation triggered.';
COMMENT ON COLUMN public.blackbox_entries.is_private        IS 'TRUE = student disabled AI scanning for this entry. Institution-configurable.';


-- =============================================================================
-- SECTION 11: ESCALATION REQUESTS
-- =============================================================================
-- Formal multi-step identity reveal protocol. Created when a Level 3 crisis
-- flag requires SPOC + Admin authorisation before any identity is revealed.
-- Every step in this workflow is immutably logged in audit_logs.
--
-- Lifecycle: pending → approved/rejected → resolved
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.escalation_requests (
  id                        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source of escalation — either a BlackBox entry or a peer session (or both).
  -- At least one of entry_id or session_id should be non-null.
  entry_id                  UUID         REFERENCES public.blackbox_entries(id) ON DELETE SET NULL,
  session_id                UUID         REFERENCES public.peer_sessions(id) ON DELETE SET NULL,

  -- SPOC who initiated the escalation request.
  spoc_id                   UUID         REFERENCES public.users(id) ON DELETE SET NULL,

  -- Admin who reviewed and approved/rejected the request. NULL until actioned.
  admin_id                  UUID         REFERENCES public.users(id) ON DELETE SET NULL,

  status                    TEXT         NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),

  -- AES-256-GCM encrypted written justification from SPOC for requesting reveal.
  -- Stored encrypted even from Admin view — decrypted only during formal review.
  justification_encrypted   TEXT,

  resolved_at               TIMESTAMPTZ,
  created_at                TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.escalation_requests IS 'Formal multi-step crisis escalation requests. SPOC initiates → Admin approves. Every action logged in audit_logs.';
COMMENT ON COLUMN public.escalation_requests.justification_encrypted IS 'SPOC written justification for identity reveal request. AES-256-GCM encrypted.';
COMMENT ON COLUMN public.escalation_requests.admin_id IS 'NULL until Admin reviews. Set on approval or rejection. Both outcomes immutably logged.';


-- =============================================================================
-- SECTION 12: CREDIT TRANSACTIONS (Immutable Ledger)
-- =============================================================================
-- The ECC (Eternia Care Credits) financial ledger. Designed to the standards
-- of an immutable financial transaction log.
--
-- CRITICAL ARCHITECTURE RULES:
--   1. Credit balance is NEVER stored as a mutable column.
--   2. Balance is ALWAYS computed as SUM(delta) for a given user_id.
--   3. Once inserted, rows in this table are NEVER updated or deleted.
--   4. Immutability is enforced by a trigger in migration 003.
--   5. Negative delta = credit spend; positive delta = credit earn/grant.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID         NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  institution_id  UUID         NOT NULL REFERENCES public.institutions(id) ON DELETE RESTRICT,

  -- Signed integer: positive = credit earned/granted, negative = credit spent.
  -- There is no separate debit column — sign convention handles both.
  delta           INTEGER      NOT NULL,

  -- Transaction type for audit and analytics:
  --   EARN     = student earned credits (quest, sound therapy, engagement)
  --   SPEND    = credits deducted for service (appointment, peer session)
  --   GRANT    = SPOC bulk allocation to student
  --   PURCHASE = student top-up via Razorpay
  --   EXPIRY   = credits expired per institution policy [Phase 2+]
  type            TEXT         NOT NULL
                  CHECK (type IN ('EARN', 'SPEND', 'GRANT', 'PURCHASE', 'EXPIRY')),

  -- Reference to the source entity (appointment ID, session ID, quest ID, etc.)
  reference_id    UUID,

  notes           TEXT,
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  -- NOTE: No updated_at — this table is APPEND ONLY. See migration 003 triggers.
);

COMMENT ON TABLE  public.credit_transactions IS 'Immutable ECC credit ledger. Append-only. No UPDATE or DELETE ever. Balance = SUM(delta) per user.';
COMMENT ON COLUMN public.credit_transactions.delta        IS 'Signed integer. Positive = earned/granted. Negative = spent. Never direct balance mutation.';
COMMENT ON COLUMN public.credit_transactions.type         IS 'EARN | SPEND | GRANT | PURCHASE | EXPIRY. EXPIRY active in Phase 2+.';
COMMENT ON COLUMN public.credit_transactions.reference_id IS 'UUID of source entity (appointment, session, quest card, etc.) for traceability.';


-- =============================================================================
-- SECTION 13: CREDIT BALANCE (Materialized View)
-- =============================================================================
-- Derived view of current credit balance per user.
-- Refreshed automatically after every INSERT on credit_transactions
-- via the trigger defined in migration 003.
--
-- CONCURRENTLY refresh requires a unique index on the view — created below.
--
-- [Phase 2+] Consider switching to an incremental update strategy if
-- credit_transactions grows beyond ~1M rows for performance.
-- =============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.credit_balance AS
  SELECT
    user_id,
    SUM(delta)       AS balance,
    COUNT(*)         AS transaction_count,
    MAX(created_at)  AS last_transaction_at
  FROM public.credit_transactions
  GROUP BY user_id;

COMMENT ON MATERIALIZED VIEW public.credit_balance IS 'Computed ECC balance per user. Refreshed after every credit_transactions INSERT. Never mutate directly.';

-- Required for REFRESH MATERIALIZED VIEW CONCURRENTLY (non-blocking refresh)
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_balance_user_id
  ON public.credit_balance (user_id);


-- =============================================================================
-- SECTION 14: SOUND CONTENT
-- =============================================================================
-- Audio tracks for Sound Therapy module. Stored on Backblaze B2 and
-- delivered via Cloudflare CDN signed URLs (TTL: 1 hour).
-- This table stores metadata only — the API server generates signed URLs
-- on demand and never handles binary audio file transfer.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sound_content (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT         NOT NULL,
  artist          TEXT,
  category        TEXT         NOT NULL
                  CHECK (category IN ('focus', 'calm', 'sleep', 'nature', 'meditation')),

  -- Backblaze B2 object key (e.g. "sounds/focus/deep-work-01.mp3").
  -- The API uses this to generate a Cloudflare-signed CDN URL.
  b2_file_key     TEXT,

  duration_sec    INTEGER      CHECK (duration_sec > 0),  -- Raw seconds for logic
  duration_label  TEXT,                                   -- Human-readable (e.g. "45 min")
  is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
  sort_order      INTEGER      NOT NULL DEFAULT 0,        -- Display ordering within category
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.sound_content              IS 'Sound Therapy audio catalogue. B2 key used to generate Cloudflare signed URLs server-side.';
COMMENT ON COLUMN public.sound_content.b2_file_key  IS 'Backblaze B2 object key. Never a direct URL — always converted to signed CDN URL by API.';
COMMENT ON COLUMN public.sound_content.sort_order   IS 'Display order within category. Lower = shown first.';


-- =============================================================================
-- SECTION 15: QUEST CARDS
-- =============================================================================
-- Structured daily wellbeing challenges and reflection prompts.
-- Completing a quest card earns ECC credits (gamified engagement).
-- Part of the Self-Help Tools module.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.quest_cards (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT         NOT NULL,
  prompt_text   TEXT         NOT NULL,
  earn_credits  INTEGER      NOT NULL DEFAULT 5
                CHECK (earn_credits >= 0),
  category      TEXT,
  difficulty    TEXT         NOT NULL DEFAULT 'easy'
                CHECK (difficulty IN ('easy', 'medium', 'hard')),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.quest_cards             IS 'Self-help quest cards. Completing a card earns ECC credits. Part of the daily engagement system.';
COMMENT ON COLUMN public.quest_cards.earn_credits IS 'ECC credits awarded on quest completion. Counts toward daily earning cap (max 5 ECC/day).';


-- =============================================================================
-- SECTION 16: AUDIT LOGS (Immutable — Append Only)
-- =============================================================================
-- Compliance-grade immutable audit log for all sensitive actions.
--
-- CRITICAL SECURITY RULES:
--   1. NO UPDATE permissions granted at the PostgreSQL role level.
--   2. NO DELETE permissions granted at the PostgreSQL role level.
--   3. Immutability enforced by trigger in migration 003.
--   4. Only ADMIN role can SELECT from this table (via RLS in migration 002).
--   5. Client applications MUST use the log_audit_event() helper function
--      (defined in migration 003) — never INSERT directly.
--
-- Logged events include: login, device bind, escalation request/approval,
-- identity reveal, admin config changes, SPOC credit grants, etc.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The user who performed the action. NULL for system-generated events.
  actor_id      UUID,  -- Intentionally no FK — logs must survive user deletion

  -- Categorical action type for filtering (e.g. 'USER_LOGIN', 'ESCALATION_APPROVED',
  -- 'IDENTITY_REVEAL', 'CREDIT_GRANT', 'DEVICE_BOUND', 'CONFIG_CHANGED').
  action_type   TEXT         NOT NULL,

  -- The table affected by the action (e.g. 'users', 'escalation_requests').
  target_table  TEXT,

  -- The primary key of the affected row.
  target_id     UUID,

  -- Flexible JSONB payload for action-specific metadata.
  -- Never store raw PII here — use hashes or references only.
  metadata      JSONB        NOT NULL DEFAULT '{}',

  -- SHA-256 hash of the actor's IP address. Never the raw IP.
  -- Used for audit correlation without storing identifiable network data.
  ip_hash       TEXT,

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
  -- NOTE: No updated_at — this table is APPEND ONLY. See migration 003 triggers.
);

COMMENT ON TABLE  public.audit_logs            IS 'Immutable compliance audit log. Append-only. NO UPDATE or DELETE ever. ADMIN read only via RLS.';
COMMENT ON COLUMN public.audit_logs.actor_id   IS 'No FK constraint — audit logs must survive user deletion for compliance continuity.';
COMMENT ON COLUMN public.audit_logs.metadata   IS 'JSONB action payload. Never store raw PII — use hashes or opaque references.';
COMMENT ON COLUMN public.audit_logs.ip_hash    IS 'SHA-256 of actor IP. Never raw IP address.';


-- =============================================================================
-- SECTION 17: ONBOARDING SESSIONS
-- =============================================================================
-- Temporary short-lived sessions created during the 5-step onboarding flow.
-- Created at Step 2 (SPOC QR scan) and consumed at Step 4 (credential setup).
-- TTL: 15 minutes. Expired rows cleaned up by scheduled job [Phase 2+].
--
-- [Phase 1] Cleanup of expired rows is manual or via a simple cron.
-- [Phase 2+] BullMQ scheduled job handles cleanup automatically.
--
-- This table is service-role only — no RLS grants to any auth role.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id                  UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id      UUID         NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,

  -- Short-lived token issued after SPOC QR validation (Step 2).
  -- Passed through the onboarding flow and consumed at Step 4.
  -- SHA-256 hashed before storage — raw token lives only in the app.
  session_token       TEXT         UNIQUE NOT NULL,

  -- Tracks how far through the 5-step onboarding the user has progressed.
  step_completed      INTEGER      NOT NULL DEFAULT 1
                      CHECK (step_completed BETWEEN 1 AND 5),

  -- Device fingerprint captured at Step 3 (device binding).
  -- Stored temporarily here until the user account is created at Step 4.
  device_fingerprint  TEXT,

  -- Hard TTL: onboarding must complete within 15 minutes of QR scan.
  expires_at          TIMESTAMPTZ  NOT NULL DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.onboarding_sessions               IS 'Temporary 5-step onboarding sessions. TTL: 15 minutes. Service role only — no client access.';
COMMENT ON COLUMN public.onboarding_sessions.session_token IS 'SHA-256 hash of token issued post-QR-scan. Raw token is in app memory only.';
COMMENT ON COLUMN public.onboarding_sessions.expires_at    IS 'Hard 15-minute expiry from QR scan time. Expired rows cleaned up by scheduled job.';


-- =============================================================================
-- SECTION 18: INDEXES
-- =============================================================================
-- All indexes required per PRD Section 12.3 — Indexing Strategy.
-- Missing indexes will cause catastrophic query degradation at scale.
-- These are created here (not inline with tables) for readability and to
-- allow easy auditing that all required indexes exist.
-- =============================================================================

-- ---- institutions -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_institutions_is_active
  ON public.institutions (is_active);

CREATE INDEX IF NOT EXISTS idx_institutions_plan_type
  ON public.institutions (plan_type);

-- ---- users ------------------------------------------------------------------
-- Composite index for the most common query pattern: all users in an institution
CREATE INDEX IF NOT EXISTS idx_users_institution_id
  ON public.users (institution_id);

CREATE INDEX IF NOT EXISTS idx_users_role
  ON public.users (role);

CREATE INDEX IF NOT EXISTS idx_users_is_active
  ON public.users (is_active);

CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON public.users (created_at DESC);

-- Composite: fetch all active students in an institution (SPOC dashboard)
CREATE INDEX IF NOT EXISTS idx_users_institution_role_active
  ON public.users (institution_id, role, is_active);

-- ---- device_sessions --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_id
  ON public.device_sessions (user_id);

CREATE INDEX IF NOT EXISTS idx_device_sessions_device_id_hash
  ON public.device_sessions (device_id_hash);

CREATE INDEX IF NOT EXISTS idx_device_sessions_expires_at
  ON public.device_sessions (expires_at);

-- Composite: validate active session for a user on a specific device
CREATE INDEX IF NOT EXISTS idx_device_sessions_user_device_active
  ON public.device_sessions (user_id, device_id_hash, revoked, expires_at);

-- ---- expert_availability ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expert_availability_expert_id
  ON public.expert_availability (expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_availability_institution_id
  ON public.expert_availability (institution_id);

CREATE INDEX IF NOT EXISTS idx_expert_availability_is_booked
  ON public.expert_availability (is_booked);

-- Composite: find available slots for an institution in a time range
CREATE INDEX IF NOT EXISTS idx_expert_availability_institution_time
  ON public.expert_availability (institution_id, is_booked, start_time);

-- ---- appointments -----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_student_id
  ON public.appointments (student_id);

CREATE INDEX IF NOT EXISTS idx_appointments_expert_id
  ON public.appointments (expert_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointments_slot_time
  ON public.appointments (slot_time DESC);

-- Composite: student's appointment history ordered by time
CREATE INDEX IF NOT EXISTS idx_appointments_student_status_time
  ON public.appointments (student_id, status, slot_time DESC);

-- ---- peer_sessions ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_peer_sessions_student_id
  ON public.peer_sessions (student_id);

CREATE INDEX IF NOT EXISTS idx_peer_sessions_listener_id
  ON public.peer_sessions (listener_id);

CREATE INDEX IF NOT EXISTS idx_peer_sessions_status
  ON public.peer_sessions (status);

CREATE INDEX IF NOT EXISTS idx_peer_sessions_started_at
  ON public.peer_sessions (started_at DESC);

-- Composite: SPOC view of flagged sessions in their institution
CREATE INDEX IF NOT EXISTS idx_peer_sessions_is_flagged
  ON public.peer_sessions (is_flagged, status);

-- ---- blackbox_entries -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_blackbox_entries_user_id
  ON public.blackbox_entries (user_id);

CREATE INDEX IF NOT EXISTS idx_blackbox_entries_ai_flag_level
  ON public.blackbox_entries (ai_flag_level);

-- Most recent entries first (default query order)
CREATE INDEX IF NOT EXISTS idx_blackbox_entries_created_at
  ON public.blackbox_entries (created_at DESC);

-- Composite: user's entries ordered by recency (primary access pattern)
CREATE INDEX IF NOT EXISTS idx_blackbox_entries_user_created
  ON public.blackbox_entries (user_id, created_at DESC);

-- ---- escalation_requests ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_escalation_requests_spoc_id
  ON public.escalation_requests (spoc_id);

CREATE INDEX IF NOT EXISTS idx_escalation_requests_status
  ON public.escalation_requests (status);

CREATE INDEX IF NOT EXISTS idx_escalation_requests_created_at
  ON public.escalation_requests (created_at DESC);

-- Composite: SPOC dashboard — pending escalations
CREATE INDEX IF NOT EXISTS idx_escalation_requests_spoc_status
  ON public.escalation_requests (spoc_id, status, created_at DESC);

-- ---- credit_transactions ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON public.credit_transactions (user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_institution_id
  ON public.credit_transactions (institution_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_type
  ON public.credit_transactions (type);

-- Most recent transactions first (wallet history default order)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at
  ON public.credit_transactions (created_at DESC);

-- Composite: user's transaction history ordered by recency
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_created
  ON public.credit_transactions (user_id, created_at DESC);

-- Composite: institution-level credit analytics (SPOC/Admin dashboard)
CREATE INDEX IF NOT EXISTS idx_credit_transactions_institution_type_created
  ON public.credit_transactions (institution_id, type, created_at DESC);

-- ---- audit_logs -------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id
  ON public.audit_logs (actor_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type
  ON public.audit_logs (action_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_target_table
  ON public.audit_logs (target_table);

-- Most recent audit entries first (Admin compliance view)
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);

-- Composite: Admin filter by action type with recency sort
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON public.audit_logs (action_type, created_at DESC);

-- GIN index on metadata JSONB for flexible audit metadata queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
  ON public.audit_logs USING GIN (metadata);

-- ---- sound_content ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_sound_content_category
  ON public.sound_content (category);

CREATE INDEX IF NOT EXISTS idx_sound_content_is_active
  ON public.sound_content (is_active);

-- Composite: active tracks per category sorted by display order
CREATE INDEX IF NOT EXISTS idx_sound_content_category_active_sort
  ON public.sound_content (category, is_active, sort_order);

-- ---- quest_cards ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_quest_cards_is_active
  ON public.quest_cards (is_active);

CREATE INDEX IF NOT EXISTS idx_quest_cards_category
  ON public.quest_cards (category);

-- ---- onboarding_sessions ----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_institution_id
  ON public.onboarding_sessions (institution_id);

-- Partial index: only non-expired sessions (most queries only care about valid sessions)
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_expires_at
  ON public.onboarding_sessions (expires_at)
  WHERE expires_at > NOW();


-- =============================================================================
-- END OF MIGRATION 001
-- =============================================================================
-- Summary:
--   Tables created : institutions, users, user_private, device_sessions,
--                    experts, peer_listeners, expert_availability,
--                    appointments, peer_sessions, blackbox_entries,
--                    escalation_requests, credit_transactions,
--                    sound_content, quest_cards, audit_logs,
--                    onboarding_sessions  (16 tables)
--   Views created  : credit_balance (1 materialized view)
--   Indexes created: ~45 indexes covering all PRD-required access patterns
--
-- Next: Run 002_rls_policies.sql
-- =============================================================================
