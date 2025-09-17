-- Biodiversity App Database Schema
-- Run this in your Supabase SQL Editor

-- Create custom types (only if they don't exist)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('explorer', 'scientist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tree_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'explorer',
    avatar_url TEXT,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trees table
CREATE TABLE IF NOT EXISTS public.trees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    common_name TEXT NOT NULL,
    scientific_name TEXT,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_description TEXT,
    height_meters DECIMAL(5, 2),
    diameter_cm DECIMAL(6, 2),
    age_estimated INTEGER,
    health_status TEXT,
    image_url TEXT,
    status tree_status DEFAULT 'pending',
    scientist_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Animals table
CREATE TABLE IF NOT EXISTS public.animals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    common_name TEXT NOT NULL,
    scientific_name TEXT,
    description TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_description TEXT,
    habitat TEXT,
    behavior_notes TEXT,
    image_url TEXT,
    status tree_status DEFAULT 'pending',
    scientist_notes TEXT,
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for trees
CREATE POLICY "Trees are viewable by everyone" ON public.trees
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own trees" ON public.trees
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trees" ON public.trees
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Scientists and admins can update any tree" ON public.trees
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('scientist', 'admin')
        )
    );

-- RLS Policies for animals
CREATE POLICY "Animals are viewable by everyone" ON public.animals
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own animals" ON public.animals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own animals" ON public.animals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Scientists and admins can update any animal" ON public.animals
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() 
            AND role IN ('scientist', 'admin')
        )
    );

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
