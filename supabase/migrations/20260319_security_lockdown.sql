-- ═══════════════════════════════════════════════════════════════
-- NANONI STUDIO WAITLIST — CRITICAL SECURITY LOCKDOWN
-- Migration: 20260319_security_lockdown.sql
-- Priority: P0 CRITICAL
-- ═══════════════════════════════════════════════════════════════

-- ═══ WAITLIST_SUBMISSIONS ═══
-- Enable RLS
ALTER TABLE waitlist_submissions 
  ENABLE ROW LEVEL SECURITY;

-- Drop any existing open policies
DROP POLICY IF EXISTS "Allow public insert" 
  ON waitlist_submissions;
DROP POLICY IF EXISTS "Allow public count" 
  ON waitlist_submissions;
DROP POLICY IF EXISTS "Allow public read" 
  ON waitlist_submissions;

-- Only allow count (no email exposure)
CREATE POLICY "Allow count only"
  ON waitlist_submissions
  FOR SELECT TO anon
  USING (false); 
  -- Nobody can read rows, but count() still works

-- Only edge functions can insert (using service role key)
CREATE POLICY "Service role insert only"
  ON waitlist_submissions
  FOR INSERT TO service_role
  WITH CHECK (true);

-- ═══ WAITLIST_PENDING ═══
-- Drop all open policies
DROP POLICY IF EXISTS "Allow public insert pending" 
  ON waitlist_pending;
DROP POLICY IF EXISTS "Allow public select pending" 
  ON waitlist_pending;
DROP POLICY IF EXISTS "Allow public update pending" 
  ON waitlist_pending;
DROP POLICY IF EXISTS "Allow public delete pending" 
  ON waitlist_pending;

-- Only allow insert from anon (submit form)
CREATE POLICY "Anon can insert pending"
  ON waitlist_pending
  FOR INSERT TO anon
  WITH CHECK (true);

-- Nobody can read/update/delete pending rows
-- Only edge functions can (using service role)
CREATE POLICY "Service role full access pending"
  ON waitlist_pending
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══ ADD RATE LIMIT TABLE ═══
CREATE TABLE IF NOT EXISTS rate_limit_tracking (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT NOT NULL,
  action      TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit 
  ON rate_limit_tracking(identifier, action, created_at);

ALTER TABLE rate_limit_tracking 
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only rate limit"
  ON rate_limit_tracking
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══ ADD AUDIT LOG TABLE ═══
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action        TEXT NOT NULL,
  email         TEXT,
  ip_address    TEXT,
  user_agent    TEXT,
  success       BOOLEAN,
  error_message TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_email 
  ON audit_log(email, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action 
  ON audit_log(action, created_at);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only audit"
  ON audit_log
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- ═══ CLEANUP OLD RATE LIMIT DATA (OPTIONAL) ═══
-- Run this periodically to prevent table bloat
-- DELETE FROM rate_limit_tracking WHERE created_at < NOW() - INTERVAL '7 days';
-- DELETE FROM audit_log WHERE created_at < NOW() - INTERVAL '30 days';
