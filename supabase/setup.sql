ALTER TABLE waitlist_submissions  
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE, 
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ; 
 
CREATE TABLE IF NOT EXISTS waitlist_pending ( 
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY, 
  name              TEXT NOT NULL, 
  email             TEXT UNIQUE NOT NULL, 
  role              TEXT, 
  source            TEXT, 
  verification_code TEXT NOT NULL, 
  code_expires_at   TIMESTAMPTZ NOT NULL, 
  created_at        TIMESTAMPTZ DEFAULT NOW() 
); 
 
ALTER TABLE waitlist_pending ENABLE ROW LEVEL SECURITY; 
 
CREATE POLICY "Allow public insert pending" 
  ON waitlist_pending FOR INSERT TO anon 
  WITH CHECK (true); 
 
CREATE POLICY "Allow public select pending" 
  ON waitlist_pending FOR SELECT TO anon 
  USING (true); 
 
CREATE POLICY "Allow public update pending" 
  ON waitlist_pending FOR UPDATE TO anon 
  USING (true); 
 
CREATE POLICY "Allow public delete pending" 
  ON waitlist_pending FOR DELETE TO anon 
  USING (true);