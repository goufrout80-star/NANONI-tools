-- ═══════════════════════════════════════════════════════
-- NANONI STUDIO — Vibe Templates + Generation History
-- Migration: 20260331_vibe_templates_and_history.sql
-- ═══════════════════════════════════════════════════════

-- ── vibe_templates ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS vibe_templates (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email                TEXT NOT NULL,
  name                 TEXT,
  storage_path         TEXT,
  cloudinary_url       TEXT,
  cloudinary_public_id TEXT,
  file_size_bytes      INTEGER,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vibe_templates_email
  ON vibe_templates(email, created_at DESC);

ALTER TABLE vibe_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only vibe templates" ON vibe_templates;
CREATE POLICY "Service role only vibe templates"
  ON vibe_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── generation_history ──────────────────────────────────
CREATE TABLE IF NOT EXISTS generation_history (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email          TEXT NOT NULL,
  tool_name      TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'processing',
  resolution     TEXT,
  aspect_ratio   TEXT,
  model_tier     TEXT,
  credits_used   INTEGER DEFAULT 0,
  result_path    TEXT,
  source_path    TEXT,
  target_path    TEXT,
  cloudinary_url TEXT,
  prompt         TEXT,
  error_message  TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_history_email
  ON generation_history(email, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generation_history_tool
  ON generation_history(tool_name, created_at DESC);

ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only generation history" ON generation_history;
CREATE POLICY "Service role only generation history"
  ON generation_history FOR ALL TO service_role
  USING (true) WITH CHECK (true);
