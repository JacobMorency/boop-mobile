-- Migration to add name field to devices table
-- Run this in your Supabase SQL editor

-- Add name column to devices table
ALTER TABLE devices ADD COLUMN name text;

-- Update existing devices to have a default name if they don't have one
UPDATE devices SET name = 'Anonymous' WHERE name IS NULL;

-- Make name not null with a default
ALTER TABLE devices ALTER COLUMN name SET DEFAULT 'Anonymous';
ALTER TABLE devices ALTER COLUMN name SET NOT NULL;
