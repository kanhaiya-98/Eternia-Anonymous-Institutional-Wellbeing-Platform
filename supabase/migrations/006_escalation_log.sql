-- Adds escalation_log table with emergency contact fields and is_acknowledged
-- Run in Supabase SQL Editor (safe to run multiple times)

CREATE TABLE IF NOT EXISTS public.escalation_log (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eternia_code              TEXT NOT NULL,
  escalated_by              TEXT DEFAULT 'Doctor',
  escalation_level          TEXT DEFAULT 'Level 3',
  timestamp                 TIMESTAMPTZ DEFAULT NOW(),
  session_info              TEXT,
  student_username          TEXT,
  emergency_contact_name    TEXT,
  emergency_contact_phone   TEXT,
  emergency_contact_relation TEXT,
  is_acknowledged           BOOLEAN DEFAULT FALSE,
  created_at                TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for demo
ALTER TABLE public.escalation_log DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.escalation_log TO service_role;

-- Safe to run on existing table — adds columns if missing
ALTER TABLE public.escalation_log ADD COLUMN IF NOT EXISTS is_acknowledged BOOLEAN DEFAULT FALSE;
ALTER TABLE public.escalation_log ADD COLUMN IF NOT EXISTS student_username TEXT;
ALTER TABLE public.escalation_log ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.escalation_log ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE public.escalation_log ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
