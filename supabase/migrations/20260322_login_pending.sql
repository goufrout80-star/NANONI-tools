-- ═══════════════════════════════════════════════════════════════
-- NANONI STUDIO — LOGIN PENDING TABLE
-- Migration: 20260322_login_pending.sql
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS login_pending (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email             TEXT NOT NULL UNIQUE,
  verification_code TEXT NOT NULL,
  code_expires_at   TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_pending_email
  ON login_pending(email);

ALTER TABLE login_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only login_pending"
  ON login_pending
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);
