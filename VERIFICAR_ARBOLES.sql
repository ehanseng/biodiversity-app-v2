-- Verificar que los árboles están en la base de datos
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar tus árboles en la BD
SELECT 
  id,
  common_name as "Nombre",
  approval_status as "Estado",
  created_at as "Fecha Creación",
  user_id as "User ID"
FROM trees 
WHERE user_id = 'b39251d7-564e-4837-9506-97c7918cdd5b'
ORDER BY created_at DESC;

-- 2. Contar total de árboles
SELECT 
  COUNT(*) as "Total Árboles",
  COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as "Aprobados",
  COUNT(CASE WHEN approval_status = 'pending' THEN 1 END) as "Pendientes"
FROM trees 
WHERE user_id = 'b39251d7-564e-4837-9506-97c7918cdd5b';

-- 3. Verificar tu perfil
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles 
WHERE id = 'b39251d7-564e-4837-9506-97c7918cdd5b';

-- 4. Verificar todos los árboles (para debug)
SELECT 
  t.common_name,
  t.user_id,
  p.full_name as "Creador",
  t.approval_status,
  t.created_at
FROM trees t
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC
LIMIT 20;
