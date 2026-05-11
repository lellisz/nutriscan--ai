-- ============================================================
-- PRAXIS Nutrition v3 - meal reminders
-- Adds user notification preferences to profiles
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS reminder_lunch_hour INT DEFAULT 12,
  ADD COLUMN IF NOT EXISTS reminder_dinner_hour INT DEFAULT 19,
  ADD COLUMN IF NOT EXISTS reminders_enabled BOOLEAN DEFAULT false;
