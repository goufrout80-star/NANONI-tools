-- ═══════════════════════════════════════════════════════
-- Vibe Swap templates table (separate from face swap)
-- ═══════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS vibe_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  storage_path TEXT,
  cloudinary_url TEXT,
  cloudinary_public_id TEXT,
  file_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE vibe_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role only vibe templates"
  ON vibe_templates FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ═══════════════════════════════════════════════════════
-- Add new tools to tools_config
-- ═══════════════════════════════════════════════════════
INSERT INTO tools_config (tool_name, is_active)
VALUES
  ('ai_generate', true),
  ('vibe_swap', true)
ON CONFLICT (tool_name) DO NOTHING;

-- ═══════════════════════════════════════════════════════
-- Add prompts to admin_settings
-- ═══════════════════════════════════════════════════════
INSERT INTO admin_settings (key, value) VALUES
('ai_generate_prompt', 'Generate an image based on this description:'),
('vibe_swap_prompt', 'IDENTITY LOCK (FROM IMAGE_1):
- Keep the person exactly the same
- Same face, same skin tone, same facial details
- Same hair style, hair length, hair color
- Same body proportions
- Do NOT change, edit, beautify, or stylize the face or skin
- Do NOT change hair in any way

POSITION & CAMERA LOCK (FROM IMAGE_1):
- Keep the exact same position of the person
- Keep the exact same pose, camera angle, framing, crop
- MAINTAIN THE EXACT ASPECT RATIO AND DIMENSIONS FROM IMAGE_1

STYLE / THEME TRANSFER (FROM IMAGE_2 ONLY):
- Apply the era, theme, mood, and atmosphere of Image_2
- Change clothing only to match the theme of Image_2
- Convert environment colors, lighting, textures, materials to match Image_2
- Replace modern elements with theme-accurate ones
- Do NOT copy pose or composition from Image_2

RESTRICTIONS (STRICT):
- NO face swap, NO pose change, NO skin change, NO hair change
- NO identity change, NO extra people, NO text or logos or watermarks

OUTPUT:
- Ultra-realistic, cinematic render
- MUST match Image_1 aspect ratio exactly
- Image_1 photographed in the world, era, and style of Image_2')
ON CONFLICT (key) DO NOTHING;
