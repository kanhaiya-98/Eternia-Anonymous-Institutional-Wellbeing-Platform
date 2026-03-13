-- =============================================================================
-- ETERNIA — Migration 004: Seed Data
-- =============================================================================
-- Platform : Eternia — Anonymous Institutional Student Wellbeing Platform
-- Version  : 1.0 (Phase 1 — Modular Monolith, 0–10,000 Users)
-- Run order: Must run AFTER 003_functions_and_triggers.sql. Final migration.
--
-- What this file seeds:
--   1.  Demo institution        — 1 row  (DEMO2025 — dev/staging only)
--   2.  Experts / therapists    — 6 rows (matches scripts/002_seed_data.sql)
--   3.  Peer listeners / interns— 6 rows (matches scripts/002_seed_data.sql)
--   4.  Sound content           — 10 rows (focus, calm, sleep, nature categories)
--   5.  Quest cards             — 5 rows (self-help tools, ECC earning activities)
--
-- Idempotency:
--   All INSERTs use ON CONFLICT DO NOTHING so this migration can be re-run
--   safely on a database that already has seed data (e.g. after a schema reset
--   and re-migration without dropping data). No duplicate rows will be created.
--
-- Production note:
--   The demo institution row (DEMO2025) is appropriate for development and
--   staging environments. For a clean production launch, either:
--     a) Omit the institution INSERT below, or
--     b) Run this file as-is and deactivate the demo institution via:
--        UPDATE public.institutions SET is_active = FALSE
--        WHERE eternia_code = 'DEMO2025';
--
--   The experts, peer_listeners, sound_content, and quest_cards rows are
--   production-appropriate and should be seeded in all environments.
--
-- Phase notes:
--   [Phase 1]  — Active in current deployment
--   [Phase 2+] — Noted where rows support future features not yet activated
-- =============================================================================


-- =============================================================================
-- SECTION 1: DEMO INSTITUTION
-- =============================================================================
-- A single demo institution for development, QA, and staging purposes.
-- eternia_code "DEMO2025" can be used to test the full 5-step onboarding flow.
--
-- [Phase 1] eternia_code stored as plain text.
-- [Phase 2+] Must be migrated to HMAC-SHA256 hash — see migration 001 notes.
--
-- credits_pool = 10,000 ECC — enough to fully test all credit flows without
-- needing to simulate Razorpay purchases or SPOC grant operations.
-- =============================================================================

INSERT INTO public.institutions (
  id,
  name,
  eternia_code,
  spoc_user_id,
  plan_type,
  credits_pool,
  is_active,
  created_at,
  updated_at
)
VALUES (
  'a1b2c3d4-0001-0001-0001-000000000001',  -- Fixed UUID for reproducible dev environments
  'Demo University',
  'DEMO2025',
  NULL,                                     -- SPOC assigned after SPOC user account is created
  'pro',
  10000,
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (eternia_code) DO NOTHING;

-- Helpful comment for developers using the demo institution:
-- eternia_code : DEMO2025
-- plan_type    : pro
-- credits_pool : 10,000 ECC
-- SPOC setup   : After creating a SPOC user account, run:
--                UPDATE public.institutions
--                SET spoc_user_id = '<spoc-user-uuid>'
--                WHERE eternia_code = 'DEMO2025';


-- =============================================================================
-- SECTION 2: EXPERTS (Verified Mental Health Professionals)
-- =============================================================================
-- Six verified therapists / counsellors available for Expert Appointment booking.
-- These professionals are displayed in the Expert Connect portal of the app.
--
-- Data matches scripts/002_seed_data.sql exactly — single source of truth.
--
-- Field notes:
--   initials    — Two-letter avatar initials shown in the app UI
--   availability— Human-readable label (not a computed value); updated by Admin
--                 via the dashboard when the expert's schedule changes
--   experience  — Free-text string (e.g. "10+ years", "8 years")
--   rating      — Manually seeded; will be updated by the rating engine in Phase 2
--   is_active   — All seeded experts are active; Admin can deactivate via dashboard
--
-- [Phase 2+] Expert accounts will link to auth.users rows (role = EXPERT),
--            enabling experts to log in and manage their own calendars.
--            For Phase 1, experts are catalogue-only records.
-- =============================================================================

INSERT INTO public.experts (
  name,
  specialization,
  experience,
  rating,
  availability,
  initials,
  bio,
  is_active
)
VALUES
  (
    'Dr. Priya Sharma',
    'Anxiety & Stress Management',
    '10+ years',
    4.9,
    'Available Today',
    'PS',
    'Specialized in helping students cope with academic pressure and anxiety disorders.',
    TRUE
  ),
  (
    'Dr. Rahul Mehta',
    'Depression & Mood Disorders',
    '8 years',
    4.8,
    'Available Tomorrow',
    'RM',
    'Expert in cognitive behavioral therapy for mood disorders.',
    TRUE
  ),
  (
    'Dr. Ananya Patel',
    'Student Counseling',
    '6 years',
    4.7,
    'Available Today',
    'AP',
    'Dedicated to supporting students through their academic journey.',
    TRUE
  ),
  (
    'Dr. Vikram Singh',
    'Trauma & PTSD',
    '12 years',
    4.9,
    'Next Week',
    'VS',
    'Specialized in trauma-informed care and EMDR therapy.',
    TRUE
  ),
  (
    'Dr. Sneha Gupta',
    'Relationship Counseling',
    '7 years',
    4.6,
    'Available Today',
    'SG',
    'Helping individuals navigate personal and social relationships.',
    TRUE
  ),
  (
    'Dr. Arjun Nair',
    'Career & Academic Stress',
    '5 years',
    4.8,
    'Available Tomorrow',
    'AN',
    'Focused on career guidance and academic stress management.',
    TRUE
  )
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 3: PEER LISTENERS (Trained Psychology Interns)
-- =============================================================================
-- Six trained psychology interns available for anonymous Peer Connect sessions.
-- Interns are displayed in the Peer Connect portal of the app.
--
-- Data matches scripts/002_seed_data.sql exactly — single source of truth.
--
-- Field notes:
--   sessions_completed — Seeded with realistic historical counts; incremented
--                         by the peer_sessions completion trigger in Phase 2
--   is_good_listener   — Training badge: TRUE = intern passed Day 7 interview
--                         and is cleared for live sessions (per PRD Section 19)
--   is_active          — All seeded listeners are active; Admin can deactivate
--
-- [Phase 2+] Peer listener accounts will link to auth.users rows (role = INTERN),
--            enabling interns to log in, see their session queue, and complete
--            the mandatory training program. The is_good_listener flag maps to
--            training_status = ACTIVE in the intern training module.
-- =============================================================================

INSERT INTO public.peer_listeners (
  name,
  specialization,
  sessions_completed,
  rating,
  availability,
  initials,
  is_good_listener,
  bio,
  is_active
)
VALUES
  (
    'Aisha Rahman',
    'Anxiety Support',
    156,
    4.9,
    'Available Now',
    'AR',
    TRUE,
    'Fellow student who understands exam stress and anxiety.',
    TRUE
  ),
  (
    'Rohan Kapoor',
    'Academic Stress',
    203,
    4.8,
    'Available Now',
    'RK',
    TRUE,
    'Senior student helping juniors with academic challenges.',
    TRUE
  ),
  (
    'Meera Joshi',
    'Relationship Issues',
    178,
    4.7,
    'Available Today',
    'MJ',
    TRUE,
    'Trained peer counselor for personal matters.',
    TRUE
  ),
  (
    'Karan Malhotra',
    'Career Guidance',
    145,
    4.9,
    'Available Now',
    'KM',
    TRUE,
    'Graduate student offering career advice.',
    TRUE
  ),
  (
    'Priya Desai',
    'Self-Esteem',
    189,
    4.8,
    'Available Today',
    'PD',
    TRUE,
    'Psychology student passionate about helping others.',
    TRUE
  ),
  (
    'Aryan Shah',
    'General Support',
    234,
    4.9,
    'Available Now',
    'AS',
    TRUE,
    'Experienced listener for any topic you need to discuss.',
    TRUE
  )
ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 4: SOUND CONTENT (Sound Therapy Audio Catalogue)
-- =============================================================================
-- Ten audio tracks across four categories for the Sound Therapy module.
-- Audio files are stored on Backblaze B2 — the b2_file_key column stores the
-- B2 object key that the API uses to generate a Cloudflare-signed CDN URL
-- (TTL: 1 hour). The app streams audio; it never downloads the file.
--
-- b2_file_key format convention: sounds/<category>/<slug>.mp3
-- Placeholder keys are used here — replace with real B2 object keys once
-- audio files have been uploaded to the Backblaze B2 bucket.
--
-- sort_order determines display order within each category (lower = first).
--
-- Categories:
--   focus     — Concentration and deep-work soundscapes
--   calm      — Anxiety relief and relaxation tracks
--   sleep     — Sleep-onset and rest tracks
--   nature    — Natural environment soundscapes
--   meditation— Guided meditation (seeded in Phase 2+ when guided audio is ready)
--
-- [Phase 2+] Play history will be logged to a play_history table (aggregate only,
--            no individual PII) for engagement analytics on the Admin dashboard.
-- =============================================================================

INSERT INTO public.sound_content (
  title,
  artist,
  category,
  b2_file_key,
  duration_sec,
  duration_label,
  is_active,
  sort_order
)
VALUES

  -- ---- FOCUS (3 tracks) -------------------------------------------------------
  -- Deep-work and concentration soundscapes for study sessions
  (
    'Deep Focus Flow',
    'Eternia Soundscapes',
    'focus',
    'sounds/focus/deep-focus-flow.mp3',
    3600,       -- 60 minutes
    '60 min',
    TRUE,
    1
  ),
  (
    'Study Frequency 40Hz',
    'Eternia Soundscapes',
    'focus',
    'sounds/focus/study-frequency-40hz.mp3',
    2700,       -- 45 minutes
    '45 min',
    TRUE,
    2
  ),
  (
    'White Noise Workspace',
    'Eternia Soundscapes',
    'focus',
    'sounds/focus/white-noise-workspace.mp3',
    3600,       -- 60 minutes
    '60 min',
    TRUE,
    3
  ),

  -- ---- CALM (3 tracks) --------------------------------------------------------
  -- Anxiety relief and stress-reduction tracks
  (
    'Gentle Rain on Leaves',
    'Eternia Soundscapes',
    'calm',
    'sounds/calm/gentle-rain-on-leaves.mp3',
    1800,       -- 30 minutes
    '30 min',
    TRUE,
    1
  ),
  (
    'Soft Piano Breath',
    'Eternia Soundscapes',
    'calm',
    'sounds/calm/soft-piano-breath.mp3',
    1200,       -- 20 minutes
    '20 min',
    TRUE,
    2
  ),
  (
    'Delta Wave Reset',
    'Eternia Soundscapes',
    'calm',
    'sounds/calm/delta-wave-reset.mp3',
    2400,       -- 40 minutes
    '40 min',
    TRUE,
    3
  ),

  -- ---- SLEEP (2 tracks) -------------------------------------------------------
  -- Sleep-onset and overnight rest tracks
  (
    'Midnight Ocean Waves',
    'Eternia Soundscapes',
    'sleep',
    'sounds/sleep/midnight-ocean-waves.mp3',
    7200,       -- 120 minutes
    '2 hr',
    TRUE,
    1
  ),
  (
    'Theta Drift',
    'Eternia Soundscapes',
    'sleep',
    'sounds/sleep/theta-drift.mp3',
    5400,       -- 90 minutes
    '90 min',
    TRUE,
    2
  ),

  -- ---- NATURE (2 tracks) ------------------------------------------------------
  -- Natural environment soundscapes for grounding and presence
  (
    'Monsoon Forest',
    'Eternia Soundscapes',
    'nature',
    'sounds/nature/monsoon-forest.mp3',
    3600,       -- 60 minutes
    '60 min',
    TRUE,
    1
  ),
  (
    'Mountain Stream at Dawn',
    'Eternia Soundscapes',
    'nature',
    'sounds/nature/mountain-stream-at-dawn.mp3',
    2700,       -- 45 minutes
    '45 min',
    TRUE,
    2
  )

ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 5: QUEST CARDS (Self-Help Challenges)
-- =============================================================================
-- Five quest cards for the Self-Help Tools module.
-- Each completed quest earns ECC credits (gamified engagement).
--
-- Quest cards are daily micro-wellbeing challenges and reflection prompts.
-- They are NOT diagnostic instruments — they are supportive tools.
--
-- earn_credits counts toward the daily earning cap:
--   Maximum ECC earnable per user per day = 5 ECC (enforced at API layer).
--   Cards are designed so completing one card per day fills the daily cap.
--
-- difficulty levels:
--   easy   — 2–3 minute activities; low commitment; good for first-time users
--   medium — 5–10 minute reflections; requires some thought
--   hard   — 15+ minute deep-work challenges; higher ECC reward
--
-- category is a free-text tag used for filtering in the UI.
--
-- [Phase 2+] Quest completion events will trigger credit EARN transactions
--            via the BullMQ async job queue (not synchronously in the request path).
--            The reference_id on the credit_transaction will be the quest_card.id.
-- =============================================================================

INSERT INTO public.quest_cards (
  title,
  prompt_text,
  earn_credits,
  category,
  difficulty,
  is_active
)
VALUES

  -- ---- EASY ---------------------------------------------------------------
  (
    'Three Good Things',
    'Take a moment right now and write down three things that went well today — '
    'no matter how small. It could be a warm meal, a kind word, or simply waking up. '
    'Reflect on why each one happened and what it means to you.',
    3,
    'Gratitude',
    'easy',
    TRUE
  ),
  (
    'One Breath Reset',
    'Set a 5-minute timer. Sit comfortably, close your eyes, and breathe in for '
    '4 counts, hold for 4 counts, breathe out for 6 counts. Repeat until the timer ends. '
    'When you finish, notice how you feel compared to when you started.',
    2,
    'Mindfulness',
    'easy',
    TRUE
  ),

  -- ---- MEDIUM ---------------------------------------------------------------
  (
    'The Letter to Future You',
    'Write a short letter (at least 100 words) to yourself — the version of you '
    'who is three months from today. What do you want them to know? '
    'What challenge are you currently working through? '
    'What hope do you want to carry forward? Seal it mentally and let it go.',
    5,
    'Reflection',
    'medium',
    TRUE
  ),
  (
    'Emotion Mapping',
    'Draw or describe your emotional landscape right now. '
    'Name at least three emotions you can feel in your body — where do you feel them? '
    'Chest, shoulders, jaw, stomach? Give each one a colour and a texture. '
    'You are not your emotions — you are the one noticing them.',
    5,
    'Emotional Awareness',
    'medium',
    TRUE
  ),

  -- ---- HARD ---------------------------------------------------------------
  (
    'Values Audit',
    'List your top five personal values (e.g. honesty, connection, growth, peace, purpose). '
    'For each value, write two sentences: one describing how this value shows up in your '
    'daily life right now, and one describing where it feels most neglected or under pressure. '
    'What is one small action this week that would better honour the value that needs the most attention?',
    5,
    'Self-Discovery',
    'hard',
    TRUE
  )

ON CONFLICT DO NOTHING;


-- =============================================================================
-- SECTION 6: POST-SEED VERIFICATION QUERIES
-- =============================================================================
-- Run these queries after seeding to verify everything loaded correctly.
-- Expected row counts are noted beside each query.
--
-- SELECT 'institutions'    AS tbl, COUNT(*) AS rows FROM public.institutions;    -- 1
-- SELECT 'experts'         AS tbl, COUNT(*) AS rows FROM public.experts;         -- 6
-- SELECT 'peer_listeners'  AS tbl, COUNT(*) AS rows FROM public.peer_listeners;  -- 6
-- SELECT 'sound_content'   AS tbl, COUNT(*) AS rows FROM public.sound_content;   -- 10
-- SELECT 'quest_cards'     AS tbl, COUNT(*) AS rows FROM public.quest_cards;     -- 5
--
-- Verify categories are correct:
-- SELECT category, COUNT(*) FROM public.sound_content GROUP BY category ORDER BY category;
-- Expected:
--   calm    | 3
--   focus   | 3
--   nature  | 2
--   sleep   | 2
--
-- Verify quest difficulties:
-- SELECT difficulty, COUNT(*) FROM public.quest_cards GROUP BY difficulty ORDER BY difficulty;
-- Expected:
--   easy   | 2
--   hard   | 1
--   medium | 2
--
-- Verify demo institution:
-- SELECT name, eternia_code, plan_type, credits_pool, is_active
-- FROM public.institutions WHERE eternia_code = 'DEMO2025';
-- Expected:
--   Demo University | DEMO2025 | pro | 10000 | t
-- =============================================================================


-- =============================================================================
-- END OF MIGRATION 004
-- =============================================================================
-- All four migrations have now been executed. The Eternia database is fully
-- initialised with schema, RLS policies, functions, triggers, and seed data.
--
-- Migration summary:
--   001_schema.sql              — 16 tables, 1 materialized view, ~45 indexes
--   002_rls_policies.sql        — RLS on all tables, ~55 policies, 3 helper functions
--   003_functions_and_triggers.sql — 13 functions, 9 triggers
--   004_seed_data.sql           — 1 institution, 6 experts, 6 listeners,
--                                  10 sounds, 5 quest cards
--
-- Next steps:
--   1. Set NEXT_PUBLIC_SUPABASE_URL in .env.local
--   2. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
--   3. Set SUPABASE_SERVICE_ROLE_KEY in .env.local (server-side only)
--   4. Confirm email confirmation is DISABLED in Supabase Auth settings
--   5. Upload audio files to Backblaze B2 and update sound_content.b2_file_key
--   6. Create first SPOC user account and link to demo institution spoc_user_id
--   7. Run: npm run dev
--
-- Refer to supabase/README.md for full setup and verification instructions.
-- =============================================================================
