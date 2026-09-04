-- ⚠️  DO NOT RUN — not harmful, but unnecessary and unused.
-- The current React app's InventoryItem type never reads item_type or
-- description; this was for the old Nuxt app. Use MASTER_SETUP.sql, which
-- is the complete, accurate script for the live database. Kept for history.

-- Migration: Add item_type and description columns to inventory
-- Run this in your Supabase SQL Editor if not already present.

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- Update existing rows to set default item_type
UPDATE inventory SET item_type = 'product' WHERE item_type IS NULL;
