-- Versión segura para agregar columnas a la tabla users
-- Este script verifica si las columnas existen antes de agregarlas

-- Verificar estructura actual
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
AND TABLE_NAME = 'users';

-- Agregar is_active solo si no existe
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1',
        'SELECT "Columna is_active ya existe" as mensaje'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'is_active'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar deleted_at solo si no existe
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL',
        'SELECT "Columna deleted_at ya existe" as mensaje'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'deleted_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar updated_at solo si no existe
SET @sql = (
    SELECT IF(
        COUNT(*) = 0,
        'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        'SELECT "Columna updated_at ya existe" as mensaje'
    )
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'ieeetadeo2006_biodiversity_app' 
    AND TABLE_NAME = 'users' 
    AND COLUMN_NAME = 'updated_at'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Actualizar usuarios existentes para que estén activos
UPDATE users SET is_active = 1 WHERE is_active IS NULL OR is_active = 0;

-- Crear índices (estos sí soportan IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Verificar estructura final
DESCRIBE users;
