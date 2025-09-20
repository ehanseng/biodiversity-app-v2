# 🗄️ Configuración MySQL con XAMPP

## 📋 Pasos para Configurar

### 1. **Preparar XAMPP**
```bash
# Iniciar XAMPP Control Panel
# Activar Apache y MySQL
```

### 2. **Crear Base de Datos**
```bash
# Abrir phpMyAdmin: http://localhost/phpmyadmin
# Ejecutar el archivo: backend/database/schema.sql
```

### 3. **Configurar Backend**
```bash
# Navegar al directorio backend
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Instalar dependencias
npm install

# Iniciar servidor
npm run dev
```

### 4. **Verificar Conexión**
```bash
# Probar API
curl http://localhost:3001/api/health

# Debería responder:
{
  "status": "OK",
  "message": "Biodiversity API funcionando correctamente",
  "timestamp": "2024-01-XX..."
}
```

## 🔧 Configuración .env

```env
# Configuración MySQL (XAMPP por defecto)
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=biodiversity_db

# Puerto del servidor
PORT=3001

# JWT Secret
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui
```

## 📊 Estructura de Base de Datos

### Tabla `users`
- `id` (INT, PRIMARY KEY)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `full_name` (VARCHAR)
- `role` (ENUM: explorer, scientist, admin)
- `created_at`, `updated_at` (TIMESTAMP)

### Tabla `biodiversity_records`
- `id` (INT, PRIMARY KEY)
- `user_id` (INT, FOREIGN KEY)
- `type` (ENUM: flora, fauna)
- `common_name`, `scientific_name` (VARCHAR)
- `description` (TEXT)
- `latitude`, `longitude` (DECIMAL)
- `location_description` (TEXT)
- **Flora**: `height_meters`, `diameter_cm`, `health_status`
- **Fauna**: `animal_class`, `habitat`, `behavior`
- `image_url` (TEXT)
- `status` (ENUM: pending, approved, rejected)
- `reviewed_by`, `reviewed_at`, `review_notes`
- `created_at`, `updated_at` (TIMESTAMP)

## 🧪 Datos de Prueba

### Usuarios:
- **explorer@vibo.co** / explorer123
- **scientist@vibo.co** / scientist123
- **admin@vibo.co** / admin123

### Registros:
- **Flora**: 3 árboles (Ceiba, Guayacán, Nogal)
- **Fauna**: 3 animales (Colibrí, Ardilla, Mariposa)

## 🔗 Endpoints API

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/verify` - Verificar token

### Registros
- `GET /api/records` - Obtener registros
- `POST /api/records` - Crear registro
- `PUT /api/records/:id` - Actualizar registro
- `DELETE /api/records/:id` - Eliminar registro
- `GET /api/records/stats/summary` - Estadísticas

### Usuarios
- `GET /api/users` - Obtener usuarios
- `GET /api/users/:id` - Obtener usuario específico

## 🚀 Próximos Pasos

1. **Probar Backend**: Verificar que la API funcione
2. **Conectar Frontend**: Modificar servicios para usar API
3. **Migrar Datos**: Transferir datos de localStorage a MySQL
4. **Sincronización**: Implementar sync bidireccional
