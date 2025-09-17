-- Demo Data for Biodiversity App
-- Run this AFTER executing supabase_schema.sql

-- First, we need to insert users into auth.users (this simulates user registration)
-- Note: In production, users would register through the app, but for demo we insert directly

-- Insert demo users into auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    invited_at,
    confirmation_token,
    confirmation_sent_at,
    recovery_token,
    recovery_sent_at,
    email_change_token_new,
    email_change,
    email_change_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    phone_change_sent_at,
    email_change_token_current,
    email_change_confirm_status,
    banned_until,
    reauthentication_token,
    reauthentication_sent_at
) VALUES 
    ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'explorer@demo.com', '$2a$10$demo.hash.for.password123', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Explorer"}', FALSE, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
    ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'scientist@demo.com', '$2a$10$demo.hash.for.password123', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Dr. Carlos Scientist"}', FALSE, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL),
    ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'admin@demo.com', '$2a$10$demo.hash.for.password123', NOW(), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), '{"provider":"email","providers":["email"]}', '{"full_name":"Maria Admin"}', FALSE, NOW(), NOW(), NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL);

-- Insert profiles (this will be done automatically by the trigger, but we update roles)
-- Wait a moment for trigger to execute, then update roles
DO $$
BEGIN
    -- Small delay to ensure trigger has executed
    PERFORM pg_sleep(1);
    
    -- Update roles for demo users
    UPDATE public.profiles SET role = 'explorer' WHERE email = 'explorer@demo.com';
    UPDATE public.profiles SET role = 'scientist' WHERE email = 'scientist@demo.com';
    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@demo.com';
END $$;

-- Insert demo trees (using only basic columns that definitely exist)
INSERT INTO public.trees (user_id, common_name, scientific_name, description, latitude, longitude, location_description, status, approved_by, approved_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Ceiba', 'Ceiba pentandra', 'Árbol sagrado maya de gran tamaño, con contrafuertes impresionantes. Es el hogar de muchas especies de aves y epífitas.', 19.4326, -99.1332, 'Parque Chapultepec, Ciudad de México', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('11111111-1111-1111-1111-111111111111', 'Ahuehuete', 'Taxodium mucronatum', 'Árbol nacional de México, conocido como "árbol de la vida". Puede vivir más de 1000 años.', 19.4284, -99.1276, 'Bosque de Chapultepec, CDMX', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('22222222-2222-2222-2222-222222222222', 'Jacaranda', 'Jacaranda mimosifolia', 'Árbol ornamental originario de Argentina, famoso por sus flores moradas que cubren las calles en primavera.', 19.4320, -99.1330, 'Colonia Roma Norte, CDMX', 'pending', NULL, NULL),
    
    ('11111111-1111-1111-1111-111111111111', 'Oyamel', 'Abies religiosa', 'Conífera endémica de México, refugio invernal de la mariposa monarca.', 19.3500, -99.3000, 'Reserva de la Biosfera Mariposa Monarca', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('33333333-3333-3333-3333-333333333333', 'Pochote', 'Ceiba aesculifolia', 'Árbol deciduo con tronco verde fotosintético, adaptado a climas secos.', 20.6597, -105.2254, 'Puerto Vallarta, Jalisco', 'pending', NULL, NULL);

-- Insert demo animals (using only basic columns that definitely exist)
INSERT INTO public.animals (user_id, common_name, scientific_name, description, latitude, longitude, location_description, habitat, behavior_notes, status, approved_by, approved_at) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Colibrí oreja blanca', 'Hylocharis leucotis', 'Pequeño colibrí endémico de México, con distintivas manchas blancas detrás de los ojos.', 19.4326, -99.1332, 'Jardín Botánico UNAM', 'Jardines con flores nativas, especialmente salvias y fucksias', 'Muy territorial, defiende agresivamente las fuentes de néctar', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('22222222-2222-2222-2222-222222222222', 'Ardilla gris', 'Sciurus aureogaster', 'Ardilla común en parques urbanos de la Ciudad de México, muy adaptable al entorno urbano.', 19.4284, -99.1276, 'Parque México, Condesa', 'Árboles urbanos, especialmente jacarandas y fresnos', 'Activa durante el día, almacena comida para el invierno', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('11111111-1111-1111-1111-111111111111', 'Mariposa monarca', 'Danaus plexippus', 'Mariposa migratoria icónica que viaja miles de kilómetros desde Canadá hasta México.', 19.3500, -99.3000, 'Reserva del Pedregal de San Ángel', 'Áreas con asclepias (algodoncillo), su planta hospedera', 'Migración extraordinaria, las generaciones de otoño viven 8 meses', 'pending', NULL, NULL),
    
    ('33333333-3333-3333-3333-333333333333', 'Tlacuache', 'Didelphis virginiana', 'Único marsupial nativo de México, excelente dispersor de semillas.', 19.4200, -99.1400, 'Xochimilco, CDMX', 'Bosques urbanos, chinampas, áreas con agua', 'Nocturno, omnívoro, finge estar muerto cuando se siente amenazado', 'approved', '22222222-2222-2222-2222-222222222222', NOW()),
    
    ('11111111-1111-1111-1111-111111111111', 'Quetzal', 'Pharomachrus mocinno', 'Ave sagrada para los mayas y aztecas, símbolo de libertad y belleza.', 17.7500, -92.6333, 'Selva Lacandona, Chiapas', 'Bosque de niebla, selva alta perennifolia', 'Se alimenta principalmente de frutos de aguacatillo, anida en troncos huecos', 'pending', NULL, NULL);

-- Add some scientist notes to approved items
UPDATE public.trees SET 
    scientist_notes = 'Espécimen excepcional, importante para la conservación urbana. Recomiendo monitoreo regular de su salud.'
WHERE common_name = 'Ceiba' AND status = 'approved';

UPDATE public.trees SET 
    scientist_notes = 'Árbol histórico de gran valor cultural. Excelente estado de conservación para su edad estimada.'
WHERE common_name = 'Ahuehuete' AND status = 'approved';

UPDATE public.animals SET 
    scientist_notes = 'Observación importante para el monitoreo de polinizadores urbanos. Excelente documentación fotográfica.'
WHERE common_name = 'Colibrí oreja blanca' AND status = 'approved';

UPDATE public.animals SET 
    scientist_notes = 'Buen indicador de la salud del ecosistema urbano. Población estable en la zona.'
WHERE common_name = 'Ardilla gris' AND status = 'approved';

-- Update additional fields separately (in case columns don't exist initially)
UPDATE public.trees SET height_meters = 25.5, diameter_cm = 180, health_status = 'Excelente' WHERE common_name = 'Ceiba';
UPDATE public.trees SET height_meters = 30.2, diameter_cm = 250, health_status = 'Muy bueno' WHERE common_name = 'Ahuehuete';
UPDATE public.trees SET height_meters = 12.8, diameter_cm = 45, health_status = 'Bueno' WHERE common_name = 'Jacaranda';
UPDATE public.trees SET height_meters = 35.0, diameter_cm = 120, health_status = 'Excelente' WHERE common_name = 'Oyamel';
UPDATE public.trees SET height_meters = 18.0, diameter_cm = 80, health_status = 'Bueno' WHERE common_name = 'Pochote';

-- Update bio fields separately (in case table was created without bio column initially)
UPDATE public.profiles SET bio = 'Apasionada por la naturaleza y la conservación. Me encanta explorar bosques y documentar la biodiversidad.' WHERE email = 'explorer@demo.com';
UPDATE public.profiles SET bio = 'Biólogo especializado en taxonomía de plantas. 15 años de experiencia en investigación de ecosistemas tropicales.' WHERE email = 'scientist@demo.com';
UPDATE public.profiles SET bio = 'Coordinadora del proyecto de biodiversidad. Gestiono la plataforma y superviso la calidad de los datos.' WHERE email = 'admin@demo.com';
