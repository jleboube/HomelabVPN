-- Migration: Add platform column to wireguard_keys
-- Date: 2026-02-01
-- Description: Adds platform column to distinguish between desktop (wstunnel) and iOS relay (direct UDP) peers

-- Add platform column with default 'desktop' for existing records
ALTER TABLE wireguard_keys
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) NOT NULL DEFAULT 'desktop'
CHECK (platform IN ('desktop', 'ios-relay'));

-- Create index for filtering by platform
CREATE INDEX IF NOT EXISTS idx_wireguard_keys_platform ON wireguard_keys(platform);

-- Down migration (if needed):
-- ALTER TABLE wireguard_keys DROP COLUMN IF EXISTS platform;
