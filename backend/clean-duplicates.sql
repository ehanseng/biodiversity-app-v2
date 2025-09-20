-- Script para limpiar duplicados en la base de datos remota
-- Ejecutar en phpMyAdmin de tu servidor remoto

USE ieeetadeo2006_biodiversity_app;

-- Ver duplicados antes de eliminar
SELECT 
    common_name, 
    latitude, 
    longitude, 
    COUNT(*) as duplicates,
    GROUP_CONCAT(id ORDER BY id) as ids
FROM biodiversity_records 
GROUP BY common_name, ROUND(latitude, 4), ROUND(longitude, 4)
HAVING COUNT(*) > 1
ORDER BY duplicates DESC;

-- Crear tabla temporal con registros únicos (mantener el ID más bajo)
CREATE TEMPORARY TABLE unique_records AS
SELECT MIN(id) as keep_id
FROM biodiversity_records
GROUP BY common_name, ROUND(latitude, 4), ROUND(longitude, 4);

-- Ver cuántos registros se van a eliminar
SELECT 
    'Total registros actuales:' as info,
    COUNT(*) as count
FROM biodiversity_records
UNION ALL
SELECT 
    'Registros únicos a mantener:' as info,
    COUNT(*) as count
FROM unique_records
UNION ALL
SELECT 
    'Registros duplicados a eliminar:' as info,
    (SELECT COUNT(*) FROM biodiversity_records) - (SELECT COUNT(*) FROM unique_records) as count;

-- COMENTAR LA SIGUIENTE LÍNEA PARA EJECUTAR LA ELIMINACIÓN
-- DELETE FROM biodiversity_records WHERE id NOT IN (SELECT keep_id FROM unique_records);

-- Verificar resultado final
SELECT 
    'Registros después de limpieza:' as info,
    COUNT(*) as count
FROM biodiversity_records;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE unique_records;
