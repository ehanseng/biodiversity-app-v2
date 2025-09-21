-- Agregar columnas faltantes a la tabla users
-- Ejecutar este script en la base de datos MySQL
-- NOTA: Si alguna columna ya existe, comentar esa línea

-- Agregar columna is_active (comentar si ya existe)
ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1;

-- Agregar columna deleted_at (comentar si ya existe)
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Agregar columna updated_at (comentar si ya existe)
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Actualizar todos los usuarios existentes para que estén activos por defecto
UPDATE users SET is_active = 1 WHERE is_active IS NULL;

-- Crear índices para mejorar rendimiento (estos sí soportan IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Verificar la estructura final
DESCRIBE users;
