-- Create Demo Users - Alternative Approach
-- Instead of inserting directly into auth.users, we'll create profiles manually
-- and you'll need to create the auth users through Supabase Dashboard

-- First, delete any existing demo profiles
DELETE FROM public.profiles WHERE email IN ('explorer@demo.com', 'scientist@demo.com', 'admin@demo.com');

-- Create demo profiles with known UUIDs (you'll need to update these with real user IDs)
-- After creating users in Supabase Auth Dashboard, update the IDs below

-- Step 1: Go to Supabase Dashboard > Authentication > Users
-- Step 2: Create these users manually:
--   - Email: explorer@demo.com, Password: password123
--   - Email: scientist@demo.com, Password: password123  
--   - Email: admin@demo.com, Password: password123
-- Step 3: Copy their User IDs and update this script
-- Step 4: Run this script

-- Example (replace with actual UUIDs from Supabase Auth):
-- INSERT INTO public.profiles (id, email, full_name, role) VALUES
--   ('REPLACE-WITH-ACTUAL-UUID-1', 'explorer@demo.com', 'Ana Explorer', 'explorer'),
--   ('REPLACE-WITH-ACTUAL-UUID-2', 'scientist@demo.com', 'Dr. Carlos Scientist', 'scientist'),
--   ('REPLACE-WITH-ACTUAL-UUID-3', 'admin@demo.com', 'Maria Admin', 'admin');

-- For now, let's create a test user that you can register through the app
-- This will work with the existing trigger system
