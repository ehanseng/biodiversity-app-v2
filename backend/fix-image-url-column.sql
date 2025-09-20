-- Script para ampliar la columna image_url en MySQL
-- Ejecutar en phpMyAdmin o desde la API PHP

USE ieeetadeo2006_biodiversity_app;

-- Ampliar la columna image_url de VARCHAR(255) a TEXT
ALTER TABLE biodiversity_records MODIFY COLUMN image_url TEXT;

-- Verificar el cambio
DESCRIBE biodiversity_records;
