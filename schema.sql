-- ====================================================================
-- SUPABASE POSTGRESQL SCHEMA FOR BIRTHDAY RSVP SYSTEM
-- The Bossman Laxman's Big 50 Bash
-- ====================================================================

-- 1. Create the rsvps table
CREATE TABLE IF NOT EXISTS public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_name TEXT NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('attending', 'declined')),
  accompanying_guests INTEGER NOT NULL DEFAULT 0,
  contact_info TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create index for fast name searches and submission date sorting
CREATE INDEX IF NOT EXISTS idx_rsvps_created_at ON public.rsvps (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rsvps_guest_name ON public.rsvps (guest_name);
CREATE INDEX IF NOT EXISTS idx_rsvps_response ON public.rsvps (response);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
-- Allow anyone (guests submitting RSVP) to insert
CREATE POLICY "Allow public guests to insert RSVP"
ON public.rsvps FOR INSERT
TO public
WITH CHECK (true);

-- Allow service role or authenticated backend to read/manage all RSVPs
CREATE POLICY "Allow service role full access to RSVPs"
ON public.rsvps FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow anon key to read responses if needed (or keep private for admin only via service role)
CREATE POLICY "Allow anon read for stats"
ON public.rsvps FOR SELECT
TO anon
USING (true);
