-- Script para crear usuarios demo y árboles de ejemplo
-- Ejecutar en Supabase SQL Editor

-- 1. Crear usuarios demo en la tabla profiles con UUIDs válidos y emails
INSERT INTO profiles (id, email, full_name, role, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'maria.gonzalez@demo.com', 'María González', 'explorer', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'carlos.rodriguez@demo.com', 'Carlos Rodríguez', 'explorer', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'ana.martinez@demo.com', 'Ana Martínez', 'scientist', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'luis.fernandez@demo.com', 'Luis Fernández', 'explorer', NOW())
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar árboles demo de diferentes usuarios
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
-- Árboles de María González
('550e8400-e29b-41d4-a716-446655440001', 'Ceiba', 'Cecropia obtusifolia', 'Árbol joven encontrado cerca del río', 9.928069, -84.090725, 'Parque Nacional Manuel Antonio', 15.5, 45.2, 'Saludable', 'approved', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440001', 'Guanacaste', 'Enterolobium cyclocarpum', 'Árbol maduro con copa amplia', 9.930000, -84.092000, 'Entrada del parque', 25.0, 120.5, 'Saludable', 'pending', NOW() - INTERVAL '2 days'),

-- Árboles de Carlos Rodríguez  
('550e8400-e29b-41d4-a716-446655440002', 'Almendro de Montaña', 'Dipteryx panamensis', 'Espécimen raro encontrado en zona protegida', 9.925000, -84.088000, 'Sendero Principal', 30.2, 85.0, 'Excelente', 'approved', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Pochote', 'Bombacopsis quinata', 'Árbol con flores llamativas', 9.932000, -84.095000, 'Mirador del valle', 18.7, 65.3, 'Bueno', 'approved', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Higuerón', 'Ficus obtusifolia', 'Árbol con raíces aéreas impresionantes', 9.927500, -84.089500, 'Cerca de la playa', 22.1, 95.8, 'Saludable', 'pending', NOW() - INTERVAL '1 day'),

-- Árboles de Luis Fernández
('550e8400-e29b-41d4-a716-446655440004', 'Espavel', 'Anacardium excelsum', 'Árbol frutal nativo', 9.929000, -84.091000, 'Zona de camping', 12.3, 38.7, 'Joven pero saludable', 'pending', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440004', 'Cenízaro', 'Samanea saman', 'Árbol emblemático con copa extendida', 9.931500, -84.093500, 'Plaza central', 28.5, 150.2, 'Maduro y saludable', 'approved', NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440004', 'Corteza Amarilla', 'Tabebuia ochracea', 'Árbol con flores amarillas espectaculares', 9.926500, -84.087500, 'Sendero secundario', 16.8, 52.4, 'Floreciendo', 'pending', NOW() - INTERVAL '8 hours'),

-- Árboles adicionales para variedad
('550e8400-e29b-41d4-a716-446655440001', 'Jobo', 'Spondias mombin', 'Árbol frutal encontrado en zona húmeda', 9.924000, -84.086000, 'Quebrada Los Monos', 14.2, 42.1, 'Saludable', 'approved', NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440002', 'Cedro Amargo', 'Cedrela odorata', 'Especie valiosa para conservación', 9.933000, -84.096000, 'Bosque primario', 35.7, 180.3, 'Excelente estado', 'approved', NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440004', 'Guayacán', 'Tabebuia guayacan', 'Madera preciosa, muy resistente', 9.928500, -84.090000, 'Zona de investigación', 20.4, 78.9, 'Maduro', 'pending', NOW() - INTERVAL '2 hours');

-- 3. Verificar que se insertaron correctamente
SELECT 
  t.common_name,
  t.scientific_name,
  p.full_name as created_by,
  p.email,
  p.role,
  t.approval_status,
  t.created_at
FROM trees t
JOIN profiles p ON t.user_id = p.id
WHERE t.user_id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004'
)
ORDER BY t.created_at DESC;

-- 4. Mostrar estadísticas de los árboles demo
SELECT 
  p.full_name,
  p.email,
  p.role,
  COUNT(*) as total_trees,
  COUNT(CASE WHEN t.approval_status = 'approved' THEN 1 END) as approved,
  COUNT(CASE WHEN t.approval_status = 'pending' THEN 1 END) as pending
FROM profiles p
LEFT JOIN trees t ON p.id = t.user_id
WHERE p.id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004'
)
GROUP BY p.id, p.full_name, p.email, p.role
ORDER BY total_trees DESC;

-- 5. Mostrar todos los árboles con información del creador
SELECT 
  t.common_name as "Nombre Común",
  t.scientific_name as "Nombre Científico",
  p.full_name as "Creado por",
  p.email as "Email",
  t.approval_status as "Estado",
  t.location_description as "Ubicación",
  DATE(t.created_at) as "Fecha"
FROM trees t
JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;

-- 6. Verificar usuarios demo creados
SELECT 
  full_name as "Nombre",
  email as "Email", 
  role as "Rol",
  created_at as "Creado"
FROM profiles 
WHERE id IN (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440003',
  '550e8400-e29b-41d4-a716-446655440004'
)
ORDER BY full_name;
