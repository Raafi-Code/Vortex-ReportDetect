-- ============================================
-- WhatsApp Report Detect - Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Table: monitored_groups
-- Groups being monitored for keyword matches
-- ============================================
CREATE TABLE IF NOT EXISTS monitored_groups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_jid TEXT NOT NULL UNIQUE,
  group_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: keywords
-- Keywords used to filter messages
-- ============================================
CREATE TABLE IF NOT EXISTS keywords (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: messages
-- Filtered messages stored from WhatsApp
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  group_jid TEXT NOT NULL,
  group_name TEXT,
  sender_jid TEXT NOT NULL,
  sender_name TEXT,
  message_text TEXT,
  media_url TEXT,
  media_type TEXT, -- image, video, document, audio
  media_storage_path TEXT, -- path in Supabase Storage
  is_forwarded BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  matched_keyword TEXT,
  raw_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: forwarding_rules
-- Rules for auto-forwarding matched messages
-- ============================================
CREATE TABLE IF NOT EXISTS forwarding_rules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  source_group_jid TEXT NOT NULL,
  target_jid TEXT NOT NULL,
  target_name TEXT NOT NULL,
  target_type TEXT DEFAULT 'group' CHECK (target_type IN ('group', 'contact')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Table: app_config
-- Key-value application configuration
-- ============================================
CREATE TABLE IF NOT EXISTS app_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Default Configuration Values
-- ============================================
INSERT INTO app_config (key, value, description)
VALUES
  ('auto_forward_enabled', 'true', 'Enable/disable automatic message forwarding'),
  ('media_retention_days', '30', 'Number of days to keep media files before cleanup')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Indexes for better query performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_messages_group_jid ON messages(group_jid);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_matched_keyword ON messages(matched_keyword);
CREATE INDEX IF NOT EXISTS idx_messages_media_storage_path ON messages(media_storage_path);
CREATE INDEX IF NOT EXISTS idx_forwarding_rules_source ON forwarding_rules(source_group_jid);
CREATE INDEX IF NOT EXISTS idx_monitored_groups_jid ON monitored_groups(group_jid);

-- ============================================
-- Enable Realtime for messages table (idempotent)
-- (New messages will be pushed to frontend)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END
$$;

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_monitored_groups_updated_at ON monitored_groups;
CREATE TRIGGER update_monitored_groups_updated_at
  BEFORE UPDATE ON monitored_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forwarding_rules_updated_at ON forwarding_rules;
CREATE TRIGGER update_forwarding_rules_updated_at
  BEFORE UPDATE ON forwarding_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_config_updated_at ON app_config;
CREATE TRIGGER update_app_config_updated_at
  BEFORE UPDATE ON app_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS: Single-admin access model
-- ============================================
-- IMPORTANT:
-- Replace the email below with your actual admin email if needed.
-- This allows exactly one authenticated Supabase user to read/write all app tables.
-- Backend service_role key still bypasses RLS automatically.
-- ============================================

CREATE OR REPLACE FUNCTION is_single_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (auth.jwt() ->> 'email') = 'vortex.admin@gmail.com',
    FALSE
  );
$$;

-- Enable RLS on all app tables
ALTER TABLE monitored_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE forwarding_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Optional hardening: prevent accidental bypass by table owner roles
ALTER TABLE monitored_groups FORCE ROW LEVEL SECURITY;
ALTER TABLE keywords FORCE ROW LEVEL SECURITY;
ALTER TABLE messages FORCE ROW LEVEL SECURITY;
ALTER TABLE forwarding_rules FORCE ROW LEVEL SECURITY;
ALTER TABLE app_config FORCE ROW LEVEL SECURITY;

-- Drop old policies if re-running migration
DROP POLICY IF EXISTS "single_admin_all_monitored_groups" ON monitored_groups;
DROP POLICY IF EXISTS "single_admin_all_keywords" ON keywords;
DROP POLICY IF EXISTS "single_admin_all_messages" ON messages;
DROP POLICY IF EXISTS "single_admin_all_forwarding_rules" ON forwarding_rules;
DROP POLICY IF EXISTS "single_admin_all_app_config" ON app_config;

-- Single policy per table for full CRUD by one admin email
CREATE POLICY "single_admin_all_monitored_groups"
ON monitored_groups
FOR ALL
TO authenticated
USING (is_single_admin())
WITH CHECK (is_single_admin());

CREATE POLICY "single_admin_all_keywords"
ON keywords
FOR ALL
TO authenticated
USING (is_single_admin())
WITH CHECK (is_single_admin());

CREATE POLICY "single_admin_all_messages"
ON messages
FOR ALL
TO authenticated
USING (is_single_admin())
WITH CHECK (is_single_admin());

CREATE POLICY "single_admin_all_forwarding_rules"
ON forwarding_rules
FOR ALL
TO authenticated
USING (is_single_admin())
WITH CHECK (is_single_admin());

CREATE POLICY "single_admin_all_app_config"
ON app_config
FOR ALL
TO authenticated
USING (is_single_admin())
WITH CHECK (is_single_admin());

-- No policies for anon role = anon has no table access.
