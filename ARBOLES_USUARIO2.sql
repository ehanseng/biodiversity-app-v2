-- Árboles para el segundo usuario
-- Ejecutar en Supabase SQL Editor

-- Insertar árboles para el usuario c273a23b-2586-4787-b4e4-355fc9557e76
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
-- 2 árboles APROBADOS (estos SÍ los deberías ver)
('c273a23b-2586-4787-b4e4-355fc9557e76', 'Roble de Costa Rica', 'Quercus oleoides', 'Roble nativo encontrado en zona montañosa. [Usuario2: Ana Pérez]', 9.934000, -84.098000, 'Reserva Biológica Monteverde', 28.3, 95.7, 'Excelente', 'approved', NOW() - INTERVAL '3 days'),
('c273a23b-2586-4787-b4e4-355fc9557e76', 'Laurel', 'Cordia alliodora', 'Árbol de madera preciosa en perfecto estado. [Usuario2: Ana Pérez]', 9.926000, -84.089000, 'Bosque Nuboso', 22.8, 78.4, 'Saludable', 'approved', NOW() - INTERVAL '1 day'),

-- 2 árboles PENDIENTES (estos NO los deberías ver en "Todos")
('c273a23b-2586-4787-b4e4-355fc9557e76', 'Caoba', 'Swietenia macrophylla', 'Caoba joven en crecimiento. [Usuario2: Ana Pérez]', 9.931000, -84.094000, 'Sendero Los Quetzales', 18.5, 62.3, 'Joven pero saludable', 'pending', NOW() - INTERVAL '2 days'),
('c273a23b-2586-4787-b4e4-355fc9557e76', 'Cecropia', 'Cecropia peltata', 'Árbol pionero en zona de regeneración. [Usuario2: Ana Pérez]', 9.929500, -84.091500, 'Área de Reforestación', 15.2, 45.8, 'Creciendo', 'pending', NOW() - INTERVAL '5 hours');

-- Verificar los árboles del nuevo usuario
SELECT 
  common_name as "Nombre",
  approval_status as "Estado",
  location_description as "Ubicación",
  created_at as "Fecha"
FROM trees 
WHERE user_id = 'c273a23b-2586-4787-b4e4-355fc9557e76'
ORDER BY created_at DESC;

-- Verificar conteo por estado
SELECT 
  approval_status as "Estado",
  COUNT(*) as "Cantidad"
FROM trees 
WHERE user_id = 'c273a23b-2586-4787-b4e4-355fc9557e76'
GROUP BY approval_status;
