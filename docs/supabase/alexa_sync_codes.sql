-- ==============================================
-- Alexa Sync Codes Table for LunaCart
-- Run this in Supabase SQL Editor
-- ==============================================

-- Table to store Alexa sync codes
CREATE TABLE IF NOT EXISTS alexa_sync_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_code VARCHAR(12) UNIQUE NOT NULL,
  share_codes TEXT[] NOT NULL DEFAULT '{}',
  alexa_user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  linked_at TIMESTAMP WITH TIME ZONE,
  last_used_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_alexa_sync_code ON alexa_sync_codes(sync_code);
CREATE INDEX IF NOT EXISTS idx_alexa_user_id ON alexa_sync_codes(alexa_user_id);

-- Row Level Security
ALTER TABLE alexa_sync_codes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read their own sync code (matched by sync_code in query)
CREATE POLICY "Allow read by sync code" ON alexa_sync_codes
  FOR SELECT USING (true);

-- Allow insert (generating new codes)
CREATE POLICY "Allow insert" ON alexa_sync_codes
  FOR INSERT WITH CHECK (true);

-- Allow update (linking, updating share_codes)
CREATE POLICY "Allow update" ON alexa_sync_codes
  FOR UPDATE USING (true);

-- Function to generate a unique sync code
CREATE OR REPLACE FUNCTION generate_alexa_sync_code()
RETURNS VARCHAR(12) AS $$
DECLARE
  new_code VARCHAR(12);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code: LUNA-XXXXXX (6 alphanumeric chars)
    new_code := 'LUNA-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM alexa_sync_codes WHERE sync_code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Grant execute on function
GRANT EXECUTE ON FUNCTION generate_alexa_sync_code() TO anon, authenticated;
