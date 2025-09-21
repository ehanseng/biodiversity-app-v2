-- Script para agregar campo de aprobación de científicos
-- Ejecutar en la base de datos MySQL

-- Verificar estructura actual
SELECT 'Estructura actual de la tabla users:' as info;
DESCRIBE users;

-- Agregar campo scientist_approval_status solo si no existe
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE users ADD COLUMN scientist_approval_status ENUM(''pending'', ''approved'', ''rejected'') NULL DEFAULT NULL AFTER role',
        'SELECT "Columna scientist_approval_status ya existe" as mensaje'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'scientist_approval_status'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice para mejorar consultas (con verificación de existencia)
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'CREATE INDEX idx_users_scientist_approval ON users(scientist_approval_status)',
        'SELECT "Índice idx_users_scientist_approval ya existe" as mensaje'
    )
    FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
    AND TABLE_NAME = 'users' 
    AND INDEX_NAME = 'idx_users_scientist_approval'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar usuarios existentes según su estado actual
-- Los científicos activos se marcan como aprobados
UPDATE users 
SET scientist_approval_status = 'approved' 
WHERE role = 'scientist' AND is_active = 1;

-- Los científicos inactivos se marcan como pendientes
UPDATE users 
SET scientist_approval_status = 'pending' 
WHERE role = 'scientist' AND is_active = 0;

-- Verificar los cambios
SELECT 'Usuarios científicos después de la actualización:' as info;
SELECT 
    id, 
    full_name, 
    email, 
    role, 
    is_active, 
    scientist_approval_status,
    created_at
FROM users 
WHERE role = 'scientist' 
ORDER BY created_at DESC;

-- Mostrar estructura final
SELECT 'Estructura final de la tabla users:' as info;
DESCRIBE users;

-- Comentarios sobre el uso:
/*
VALORES DEL CAMPO scientist_approval_status:
- NULL: Para exploradores y admins (no aplica)
- 'pending': Científico registrado, esperando aprobación
- 'approved': Científico aprobado, acceso completo
- 'rejected': Científico rechazado (opcional para futuro)

LÓGICA DE LA APLICACIÓN:
- user.role === 'scientist' && user.scientist_approval_status === 'pending' → Interfaz de explorador + mensaje
- user.role === 'scientist' && user.scientist_approval_status === 'approved' → Interfaz completa de científico
- user.role === 'explorer' → Interfaz normal de explorador
- user.role === 'admin' → Interfaz de administrador
*/
