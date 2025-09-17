-- Fix RLS Policies for Authentication Issues
-- Run this in Supabase SQL Editor if you're getting "Database error querying schema"

-- Temporarily disable RLS to test
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Trees are viewable by everyone" ON public.trees;
DROP POLICY IF EXISTS "Users can insert their own trees" ON public.trees;
DROP POLICY IF EXISTS "Users can update their own trees" ON public.trees;
DROP POLICY IF EXISTS "Scientists and admins can update any tree" ON public.trees;
DROP POLICY IF EXISTS "Animals are viewable by everyone" ON public.animals;
DROP POLICY IF EXISTS "Users can insert their own animals" ON public.animals;
DROP POLICY IF EXISTS "Users can update their own animals" ON public.animals;
DROP POLICY IF EXISTS "Scientists and admins can update any animal" ON public.animals;

-- Re-enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Create simple, permissive policies for testing
CREATE POLICY "Allow all operations on profiles" ON public.profiles
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on trees" ON public.trees
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on animals" ON public.animals
    FOR ALL USING (true) WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.trees TO authenticated;
GRANT ALL ON public.animals TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.trees TO anon;
GRANT ALL ON public.animals TO anon;
