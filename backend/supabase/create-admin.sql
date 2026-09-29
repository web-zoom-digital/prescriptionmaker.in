-- =============================================================================
-- CREATE ADMIN USER — Run this AFTER main schema.sql
-- =============================================================================
-- Step 1: First create the user via Supabase Dashboard > Authentication > Add User
--         (or run the signup API). Get their UUID from auth.users.
--
-- Step 2: Then run this SQL to upgrade them to admin role:
-- =============================================================================

-- Replace 'YOUR_USER_UUID_HERE' with the actual UUID from auth.users
UPDATE public.users
SET role = 'admin', plan = 'enterprise', status = 'active'
WHERE email = 'admin@prescriptionmaker.in';  -- change to your admin email

-- Verify:
SELECT id, name, email, role, plan FROM public.users WHERE role = 'admin';

-- =============================================================================
-- ALTERNATIVE: If you want to insert admin directly (use auth UUID)
-- =============================================================================
-- INSERT INTO public.users (id, email, name, role, plan, status)
-- VALUES (
--   'YOUR_USER_UUID_HERE',  -- from auth.users table
--   'admin@prescriptionmaker.in',
--   'Super Admin',
--   'admin',
--   'enterprise',
--   'active'
-- );
