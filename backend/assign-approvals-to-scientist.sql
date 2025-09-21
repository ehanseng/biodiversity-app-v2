-- Script para asignar todas las aprobaciones al científico existente
-- Esto permitirá que aparezca en el ranking de científicos

-- Primero, verificar qué científicos/admins existen
SELECT 'Científicos y admins disponibles:' as info;
SELECT id, full_name, email, role FROM users WHERE role IN ('scientist', 'admin');

-- Obtener el ID del primer científico/admin disponible
SET @scientist_id = (SELECT id FROM users WHERE role IN ('scientist', 'admin') ORDER BY id LIMIT 1);

-- Mostrar qué científico se usará
SELECT CONCAT('Asignando aprobaciones al científico ID: ', @scientist_id) as info;
SELECT id, full_name, email, role FROM users WHERE id = @scientist_id;

-- Asignar todos los árboles aprobados al científico
UPDATE trees 
SET approved_by = @scientist_id 
WHERE status = 'approved' AND approved_by IS NULL;

-- Asignar todos los animales aprobados al científico  
UPDATE animals 
SET approved_by = @scientist_id 
WHERE status = 'approved' AND approved_by IS NULL;

-- Verificar los resultados
SELECT 'Resultados de la asignación:' as info;

SELECT 
    'Árboles asignados:' as tipo,
    COUNT(*) as cantidad
FROM trees 
WHERE approved_by = @scientist_id;

SELECT 
    'Animales asignados:' as tipo,
    COUNT(*) as cantidad  
FROM animals 
WHERE approved_by = @scientist_id;

-- Mostrar el cálculo de puntos para el científico
SELECT 
    'Puntos calculados para el científico:' as info,
    u.full_name,
    COUNT(DISTINCT t.id) as arboles_aprobados,
    COUNT(DISTINCT a.id) as animales_aprobados,
    (COUNT(DISTINCT t.id) * 10 + COUNT(DISTINCT a.id) * 15) as puntos_totales
FROM users u
LEFT JOIN trees t ON t.approved_by = u.id
LEFT JOIN animals a ON a.approved_by = u.id  
WHERE u.id = @scientist_id
GROUP BY u.id, u.full_name;
