-- Run this in Supabase SQL Editor
-- Creates the escalation_log table with acknowledgement support

CREATE TABLE IF NOT EXISTS public.escalation_log (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eternia_code      TEXT NOT NULL,
  escalated_by      TEXT DEFAULT 'Doctor',
  escalation_level  TEXT DEFAULT 'Level 3',
  timestamp         TIMESTAMPTZ DEFAULT NOW(),
  session_info      TEXT,
  is_acknowledged   BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for demo (service role bypasses anyway)
ALTER TABLE public.escalation_log DISABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.escalation_log TO service_role;

-- If table already exists, just add the column
ALTER TABLE public.escalation_log
  ADD COLUMN IF NOT EXISTS is_acknowledged BOOLEAN DEFAULT FALSE;
