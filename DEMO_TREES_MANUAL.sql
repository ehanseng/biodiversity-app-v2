-- Script para crear árboles demo - PASO A PASO
-- Ejecutar en Supabase SQL Editor

-- PASO 1: Obtener tu ID de usuario
-- Ejecuta SOLO esta consulta primero para obtener tu ID
SELECT id as "Tu User ID", 
       email, 
       full_name,
       role
FROM profiles 
ORDER BY created_at DESC
LIMIT 5;

-- PASO 2: Copia tu ID de usuario de arriba y reemplaza 'TU_USER_ID_AQUI' 
-- con tu ID real en las siguientes consultas

-- EJEMPLO: Si tu ID es '123e4567-e89b-12d3-a456-426614174000'
-- reemplaza 'TU_USER_ID_AQUI' con '123e4567-e89b-12d3-a456-426614174000'


-- PASO 3: Ejecuta esta inserción DESPUÉS de reemplazar TU_USER_ID_AQUI
INSERT INTO trees (
  user_id, 
  common_name, 
  scientific_name, 
  description, 
  latitude, 
  longitude, 
  location_description, 
  height, 
  diameter, 
  health_status, 
  approval_status, 
  created_at
) VALUES
-- Reemplaza 'TU_USER_ID_AQUI' con tu ID real obtenido en el PASO 1
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Ceiba', 'Cecropia obtusifolia', 'Árbol joven encontrado cerca del río. [Demo: María González]', 9.928069, -84.090725, 'Parque Nacional Manuel Antonio', 15.5, 45.2, 'Saludable', 'approved', NOW() - INTERVAL '5 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Guanacaste', 'Enterolobium cyclocarpum', 'Árbol maduro con copa amplia. [Demo: María González]', 9.930000, -84.092000, 'Entrada del parque', 25.0, 120.5, 'Saludable', 'pending', NOW() - INTERVAL '2 days'),

('b39251d7-564e-4837-9506-97c7918cdd5b', 'Almendro de Montaña', 'Dipteryx panamensis', 'Espécimen raro encontrado en zona protegida. [Demo: Carlos Rodríguez]', 9.925000, -84.088000, 'Sendero Principal', 30.2, 85.0, 'Excelente', 'approved', NOW() - INTERVAL '7 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Pochote', 'Bombacopsis quinata', 'Árbol con flores llamativas. [Demo: Carlos Rodríguez]', 9.932000, -84.095000, 'Mirador del valle', 18.7, 65.3, 'Bueno', 'approved', NOW() - INTERVAL '3 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Higuerón', 'Ficus obtusifolia', 'Árbol con raíces aéreas impresionantes. [Demo: Carlos Rodríguez]', 9.927500, -84.089500, 'Cerca de la playa', 22.1, 95.8, 'Saludable', 'pending', NOW() - INTERVAL '1 day'),

('b39251d7-564e-4837-9506-97c7918cdd5b', 'Espavel', 'Anacardium excelsum', 'Árbol frutal nativo. [Demo: Luis Fernández]', 9.929000, -84.091000, 'Zona de camping', 12.3, 38.7, 'Joven pero saludable', 'pending', NOW() - INTERVAL '4 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Cenízaro', 'Samanea saman', 'Árbol emblemático con copa extendida. [Demo: Luis Fernández]', 9.931500, -84.093500, 'Plaza central', 28.5, 150.2, 'Maduro y saludable', 'approved', NOW() - INTERVAL '6 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Corteza Amarilla', 'Tabebuia ochracea', 'Árbol con flores amarillas espectaculares. [Demo: Luis Fernández]', 9.926500, -84.087500, 'Sendero secundario', 16.8, 52.4, 'Floreciendo', 'pending', NOW() - INTERVAL '8 hours'),

('b39251d7-564e-4837-9506-97c7918cdd5b', 'Jobo', 'Spondias mombin', 'Árbol frutal encontrado en zona húmeda. [Demo: Ana Martínez]', 9.924000, -84.086000, 'Quebrada Los Monos', 14.2, 42.1, 'Saludable', 'approved', NOW() - INTERVAL '10 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Cedro Amargo', 'Cedrela odorata', 'Especie valiosa para conservación. [Demo: Investigador]', 9.933000, -84.096000, 'Bosque primario', 35.7, 180.3, 'Excelente estado', 'approved', NOW() - INTERVAL '12 days'),
('b39251d7-564e-4837-9506-97c7918cdd5b', 'Guayacán', 'Tabebuia guayacan', 'Madera preciosa, muy resistente. [Demo: Equipo de campo]', 9.928500, -84.090000, 'Zona de investigación', 20.4, 78.9, 'Maduro', 'pending', NOW() - INTERVAL '2 hours');


-- PASO 4: Verificar los árboles insertados (ejecutar después del PASO 3)
-- Reemplaza 'TU_USER_ID_AQUI' con tu ID real
/*
SELECT 
  common_name as "Nombre Común",
  scientific_name as "Nombre Científico",
  LEFT(description, 40) || '...' as "Descripción",
  approval_status as "Estado",
  location_description as "Ubicación",
  DATE(created_at) as "Fecha"
FROM trees 
WHERE user_id = 'TU_USER_ID_AQUI'
  AND created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
*/

-- PASO 5: Estadísticas (ejecutar después del PASO 3)
-- Reemplaza 'TU_USER_ID_AQUI' con tu ID real
/*
SELECT 
  COUNT(*) as "Total Árboles Demo",
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as "Aprobados",
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as "Pendientes"
FROM trees 
WHERE user_id = 'TU_USER_ID_AQUI'
  AND created_at > NOW() - INTERVAL '1 hour';
*/
