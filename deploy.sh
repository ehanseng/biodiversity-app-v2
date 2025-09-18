#!/bin/bash

# Script de despliegue para Biodiversity App
# Uso: ./deploy.sh [servidor]

set -e

echo "🚀 Iniciando despliegue de Biodiversity App..."

# Configuración
BUILD_DIR="dist"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
    error "Node.js no está instalado"
    exit 1
fi

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    error "npm no está instalado"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    log "Instalando dependencias..."
    npm install
fi

# Limpiar build anterior
if [ -d "$BUILD_DIR" ]; then
    log "Limpiando build anterior..."
    rm -rf "$BUILD_DIR"
fi

# Crear build de producción
log "Creando build de producción..."
npm run build:prod

# Verificar que el build fue exitoso
if [ ! -d "$BUILD_DIR" ]; then
    error "El build falló. No se encontró el directorio $BUILD_DIR"
    exit 1
fi

if [ ! -f "$BUILD_DIR/index.html" ]; then
    error "El build falló. No se encontró index.html"
    exit 1
fi

log "✅ Build completado exitosamente"

# Mostrar información del build
BUILD_SIZE=$(du -sh "$BUILD_DIR" | cut -f1)
log "Tamaño del build: $BUILD_SIZE"

# Instrucciones según el tipo de servidor
echo ""
echo "📋 INSTRUCCIONES DE DESPLIEGUE:"
echo ""
echo "1️⃣  SERVIDOR CON SSH (VPS/Dedicado):"
echo "   scp -r $BUILD_DIR/* usuario@tu-servidor:/var/www/biodiversity-app/"
echo ""
echo "2️⃣  SERVIDOR COMPARTIDO (cPanel):"
echo "   - Comprime la carpeta $BUILD_DIR en un ZIP"
echo "   - Sube el ZIP a public_html via File Manager"
echo "   - Extrae el contenido en public_html"
echo ""
echo "3️⃣  SERVIDOR CON FTP:"
echo "   - Usa FileZilla o similar"
echo "   - Sube todo el contenido de $BUILD_DIR a la carpeta web raíz"
echo ""

# Crear archivo ZIP para servidores compartidos
if command -v zip &> /dev/null; then
    ZIP_FILE="biodiversity-app-$(date +%Y%m%d_%H%M%S).zip"
    log "Creando archivo ZIP para servidores compartidos..."
    cd "$BUILD_DIR"
    zip -r "../$ZIP_FILE" .
    cd ..
    log "✅ Archivo ZIP creado: $ZIP_FILE"
    echo "📦 Archivo listo para subir: $ZIP_FILE"
fi

echo ""
echo "🎉 ¡Despliegue preparado exitosamente!"
