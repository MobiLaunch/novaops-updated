-- Migration: Add item_type and description columns to inventory
-- Run this in your Supabase SQL Editor if not already present.

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'product' CHECK (item_type IN ('product', 'service')),
  ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';

-- Update existing rows to set default item_type
UPDATE inventory SET item_type = 'product' WHERE item_type IS NULL;
