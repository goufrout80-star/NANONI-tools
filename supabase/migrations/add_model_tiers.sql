-- Add model tier configuration to admin_settings
INSERT INTO admin_settings (key, value) VALUES
  ('model_nnn1', 'gemini-3.1-flash-lite-preview'),
  ('model_nnn1_pro', 'gemini-3.1-flash-image-preview'),
  ('model_nnn1_pro_max', 'gemini-3.1-pro-preview'),
  ('credits_nnn1_1k', '1'),
  ('credits_nnn1_2k', '2'),
  ('credits_nnn1_4k', '3'),
  ('credits_nnn1pro_1k', '2'),
  ('credits_nnn1pro_2k', '4'),
  ('credits_nnn1pro_4k', '6'),
  ('credits_nnn1promax_1k', '4'),
  ('credits_nnn1promax_2k', '8'),
  ('credits_nnn1promax_4k', '12'),
  ('default_user_credits', '50')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update existing approved users with 10 or fewer credits to 50
UPDATE waitlist_submissions
SET credits = 50
WHERE approved = true 
  AND credits <= 10;
