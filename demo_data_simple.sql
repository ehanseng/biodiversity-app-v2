-- Simplified Demo Data for Biodiversity App
-- Run this AFTER executing supabase_schema.sql

-- Insert demo users into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at
) VALUES 
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'explorer@demo.com', '$2a$10$demo.hash.for.password123', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Explorer"}', FALSE, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'scientist@demo.com', '$2a$10$demo.hash.for.password123', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Carlos Scientist"}', FALSE, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'admin@demo.com', '$2a$10$demo.hash.for.password123', NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Admin"}', FALSE, NOW(), NOW());

-- Wait for trigger to create profiles, then update roles
DO $$
BEGIN
    PERFORM pg_sleep(2);
    UPDATE public.profiles SET role = 'explorer' WHERE email = 'explorer@demo.com';
    UPDATE public.profiles SET role = 'scientist' WHERE email = 'scientist@demo.com';
    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@demo.com';
END $$;

-- Insert demo trees with minimal columns
INSERT INTO public.trees (user_id, common_name, scientific_name, description, latitude, longitude, location_description) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ceiba', 'Ceiba pentandra', 'Árbol sagrado maya de gran tamaño', 19.4326, -99.1332, 'Parque Chapultepec, CDMX'),
    ('11111111-1111-1111-1111-111111111111', 'Ahuehuete', 'Taxodium mucronatum', 'Árbol nacional de México', 19.4284, -99.1276, 'Bosque de Chapultepec'),
    ('22222222-2222-2222-2222-222222222222', 'Jacaranda', 'Jacaranda mimosifolia', 'Árbol ornamental con flores moradas', 19.4320, -99.1330, 'Colonia Roma Norte'),
    ('11111111-1111-1111-1111-111111111111', 'Oyamel', 'Abies religiosa', 'Refugio de la mariposa monarca', 19.3500, -99.3000, 'Reserva Mariposa Monarca'),
    ('33333333-3333-3333-3333-333333333333', 'Pochote', 'Ceiba aesculifolia', 'Árbol con tronco verde fotosintético', 20.6597, -105.2254, 'Puerto Vallarta, Jalisco');

-- Insert demo animals with minimal columns
INSERT INTO public.animals (user_id, common_name, scientific_name, description, latitude, longitude, location_description, habitat, behavior_notes) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Colibrí oreja blanca', 'Hylocharis leucotis', 'Pequeño colibrí endémico de México', 19.4326, -99.1332, 'Jardín Botánico UNAM', 'Jardines con flores nativas', 'Muy territorial'),
    ('22222222-2222-2222-2222-222222222222', 'Ardilla gris', 'Sciurus aureogaster', 'Ardilla común en parques urbanos', 19.4284, -99.1276, 'Parque México, Condesa', 'Árboles urbanos', 'Activa durante el día'),
    ('11111111-1111-1111-1111-111111111111', 'Mariposa monarca', 'Danaus plexippus', 'Mariposa migratoria icónica', 19.3500, -99.3000, 'Reserva del Pedregal', 'Áreas con asclepias', 'Migración extraordinaria'),
    ('33333333-3333-3333-3333-333333333333', 'Tlacuache', 'Didelphis virginiana', 'Único marsupial nativo de México', 19.4200, -99.1400, 'Xochimilco, CDMX', 'Bosques urbanos', 'Nocturno, omnívoro'),
    ('11111111-1111-1111-1111-111111111111', 'Quetzal', 'Pharomachrus mocinno', 'Ave sagrada para mayas y aztecas', 17.7500, -92.6333, 'Selva Lacandona, Chiapas', 'Bosque de niebla', 'Se alimenta de frutos');
