-- Script para agregar columna approved_by a las tablas trees y animals
-- Ejecutar en la base de datos MySQL para el ranking de científicos

-- Agregar columna approved_by a la tabla trees
ALTER TABLE trees 
ADD COLUMN approved_by INT NULL 
AFTER status,
ADD INDEX idx_approved_by (approved_by);

-- Agregar columna approved_by a la tabla animals  
ALTER TABLE animals 
ADD COLUMN approved_by INT NULL 
AFTER status,
ADD INDEX idx_approved_by (approved_by);

-- Comentarios:
-- - approved_by: ID del científico/admin que aprobó el registro
-- - Se agrega después de la columna status
-- - Se crea índice para mejorar performance en consultas de ranking
-- - NULL permite registros sin aprobar aún

-- Verificar que las columnas se agregaron correctamente
SELECT 'trees table structure:' as info;
DESCRIBE trees;

SELECT 'animals table structure:' as info;  
DESCRIBE animals;

-- Mostrar conteo actual de registros aprobados
SELECT 
    'Current approved records:' as info,
    (SELECT COUNT(*) FROM trees WHERE status = 'approved') as approved_trees,
    (SELECT COUNT(*) FROM animals WHERE status = 'approved') as approved_animals;
