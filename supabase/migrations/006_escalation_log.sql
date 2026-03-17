-- Run this in Supabase SQL Editor
-- Creates a simple flat escalations table for demo persistence

CREATE TABLE IF NOT EXISTS public.escalation_log (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  eternia_code      TEXT NOT NULL,
  escalated_by      TEXT DEFAULT 'Doctor',
  escalation_level  TEXT DEFAULT 'Level 3',
  timestamp         TIMESTAMPTZ DEFAULT NOW(),
  session_info      TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Disable RLS for demo (service role bypasses anyway, but this ensures GET works)
ALTER TABLE public.escalation_log DISABLE ROW LEVEL SECURITY;

-- Allow read for API
GRANT SELECT, INSERT ON public.escalation_log TO service_role;
