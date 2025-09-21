-- Agregar columna deleted_at para soft deletes
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL;

-- Crear índice para mejorar rendimiento
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Verificar estructura
DESCRIBE users;
