-- Eternia Database Schema - Simplified

-- Experts/Therapists table (public data, no RLS needed for read)
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  experience TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  availability TEXT DEFAULT 'Available',
  initials TEXT NOT NULL,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Peer listeners table (public data, no RLS needed for read)
CREATE TABLE IF NOT EXISTS public.peer_listeners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  specialization TEXT NOT NULL,
  sessions_completed INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 4.5,
  availability TEXT DEFAULT 'Available',
  initials TEXT NOT NULL,
  is_good_listener BOOLEAN DEFAULT TRUE,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Allow public read access to experts
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "experts_public_read" ON public.experts FOR SELECT USING (true);

-- Allow public read access to peer listeners
ALTER TABLE public.peer_listeners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "peer_listeners_public_read" ON public.peer_listeners FOR SELECT USING (true);
