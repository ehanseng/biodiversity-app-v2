-- Script simplificado para crear árboles demo con tu usuario actual
-- Ejecutar en Supabase SQL Editor

-- 1. Obtener tu ID de usuario actual (ejecuta esto primero para ver tu ID)
SELECT auth.uid() as "Tu User ID", 
       email, 
       full_name 
FROM profiles 
WHERE id = auth.uid();

-- 2. Insertar árboles demo usando tu usuario actual
-- IMPORTANTE: Reemplaza 'auth.uid()' con tu ID real si es necesario
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
-- Árboles simulando diferentes exploradores
(auth.uid(), 'Ceiba', 'Cecropia obtusifolia', 'Árbol joven encontrado cerca del río. [Simulado: registrado por María González]', 9.928069, -84.090725, 'Parque Nacional Manuel Antonio', 15.5, 45.2, 'Saludable', 'approved', NOW() - INTERVAL '5 days'),
(auth.uid(), 'Guanacaste', 'Enterolobium cyclocarpum', 'Árbol maduro con copa amplia. [Simulado: registrado por María González]', 9.930000, -84.092000, 'Entrada del parque', 25.0, 120.5, 'Saludable', 'pending', NOW() - INTERVAL '2 days'),

(auth.uid(), 'Almendro de Montaña', 'Dipteryx panamensis', 'Espécimen raro encontrado en zona protegida. [Simulado: registrado por Carlos Rodríguez]', 9.925000, -84.088000, 'Sendero Principal', 30.2, 85.0, 'Excelente', 'approved', NOW() - INTERVAL '7 days'),
(auth.uid(), 'Pochote', 'Bombacopsis quinata', 'Árbol con flores llamativas. [Simulado: registrado por Carlos Rodríguez]', 9.932000, -84.095000, 'Mirador del valle', 18.7, 65.3, 'Bueno', 'approved', NOW() - INTERVAL '3 days'),
(auth.uid(), 'Higuerón', 'Ficus obtusifolia', 'Árbol con raíces aéreas impresionantes. [Simulado: registrado por Carlos Rodríguez]', 9.927500, -84.089500, 'Cerca de la playa', 22.1, 95.8, 'Saludable', 'pending', NOW() - INTERVAL '1 day'),

(auth.uid(), 'Espavel', 'Anacardium excelsum', 'Árbol frutal nativo. [Simulado: registrado por Luis Fernández]', 9.929000, -84.091000, 'Zona de camping', 12.3, 38.7, 'Joven pero saludable', 'pending', NOW() - INTERVAL '4 days'),
(auth.uid(), 'Cenízaro', 'Samanea saman', 'Árbol emblemático con copa extendida. [Simulado: registrado por Luis Fernández]', 9.931500, -84.093500, 'Plaza central', 28.5, 150.2, 'Maduro y saludable', 'approved', NOW() - INTERVAL '6 days'),
(auth.uid(), 'Corteza Amarilla', 'Tabebuia ochracea', 'Árbol con flores amarillas espectaculares. [Simulado: registrado por Luis Fernández]', 9.926500, -84.087500, 'Sendero secundario', 16.8, 52.4, 'Floreciendo', 'pending', NOW() - INTERVAL '8 hours'),

(auth.uid(), 'Jobo', 'Spondias mombin', 'Árbol frutal encontrado en zona húmeda. [Simulado: registrado por Ana Martínez]', 9.924000, -84.086000, 'Quebrada Los Monos', 14.2, 42.1, 'Saludable', 'approved', NOW() - INTERVAL '10 days'),
(auth.uid(), 'Cedro Amargo', 'Cedrela odorata', 'Especie valiosa para conservación. [Simulado: registrado por investigador externo]', 9.933000, -84.096000, 'Bosque primario', 35.7, 180.3, 'Excelente estado', 'approved', NOW() - INTERVAL '12 days'),
(auth.uid(), 'Guayacán', 'Tabebuia guayacan', 'Madera preciosa, muy resistente. [Simulado: registrado por equipo de campo]', 9.928500, -84.090000, 'Zona de investigación', 20.4, 78.9, 'Maduro', 'pending', NOW() - INTERVAL '2 hours');

-- 3. Verificar que se insertaron correctamente
SELECT 
  t.common_name as "Nombre Común",
  t.scientific_name as "Nombre Científico",
  LEFT(t.description, 50) || '...' as "Descripción",
  t.approval_status as "Estado",
  t.location_description as "Ubicación",
  DATE(t.created_at) as "Fecha",
  p.full_name as "Usuario Real"
FROM trees t
JOIN profiles p ON t.user_id = p.id
WHERE t.user_id = auth.uid()
  AND t.created_at > NOW() - INTERVAL '1 hour'  -- Solo los recién creados
ORDER BY t.created_at DESC;

-- 4. Mostrar estadísticas
SELECT 
  COUNT(*) as "Total Árboles Demo",
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as "Aprobados",
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as "Pendientes"
FROM trees 
WHERE user_id = auth.uid()
  AND created_at > NOW() - INTERVAL '1 hour';

-- 5. Mostrar todos tus árboles (incluyendo los nuevos)
SELECT 
  common_name as "Árbol",
  approval_status as "Estado",
  location_description as "Ubicación",
  DATE(created_at) as "Fecha"
FROM trees 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
