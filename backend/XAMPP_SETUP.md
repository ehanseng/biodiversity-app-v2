# 🚀 CONFIGURACIÓN XAMPP PARA BIODIVERSITY APP

## 📋 PASOS PARA CONFIGURAR MYSQL LOCAL

### 1️⃣ **Instalar XAMPP**
- Descargar desde: https://www.apachefriends.org/
- Instalar con Apache y MySQL habilitados

### 2️⃣ **Iniciar Servicios**
- Abrir XAMPP Control Panel
- Iniciar **Apache** ✅
- Iniciar **MySQL** ✅

### 3️⃣ **Crear Directorio del Proyecto**
```bash
# Crear carpeta en htdocs
C:\xampp\htdocs\biodiversity-app\
```

### 4️⃣ **Copiar Archivo API**
Copiar `local-api.php` a:
```
C:\xampp\htdocs\biodiversity-app\local-api.php
```

### 5️⃣ **Verificar Configuración**
Abrir en navegador:
```
http://localhost/biodiversity-app/local-api.php
```

Deberías ver:
```json
{
  "message": "API Local Biodiversity v1.0",
  "endpoints": {
    "POST /users": "Crear usuario",
    "POST /users/login": "Login usuario",
    "GET /health": "Estado de la API"
  }
}
```

### 6️⃣ **Probar Health Check**
```
http://localhost/biodiversity-app/local-api.php/health
```

Deberías ver:
```json
{
  "status": "OK",
  "message": "API Local funcionando",
  "timestamp": "2024-01-01T12:00:00+00:00",
  "database": "biodiversity_app"
}
```

## 🔧 **CONFIGURACIÓN AUTOMÁTICA**

La API automáticamente:
- ✅ Crea la base de datos `biodiversity_app`
- ✅ Crea la tabla `users` con la estructura correcta
- ✅ Configura CORS para desarrollo local
- ✅ Maneja errores y logging

## 🧪 **PROBAR DESDE LA APP**

Una vez configurado XAMPP:

1. **Iniciar la app React**: `npm start`
2. **Ir al formulario de registro**
3. **Registrarse con**: `erick@ieee.org` / `erick123`
4. **Verificar en phpMyAdmin**: `http://localhost/phpmyadmin`

## 📊 **VERIFICAR BASE DE DATOS**

En phpMyAdmin:
- Base de datos: `biodiversity_app`
- Tabla: `users`
- Verificar que el usuario se creó correctamente

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### Error: "No se pudo conectar"
- ✅ Verificar que Apache y MySQL estén iniciados
- ✅ Verificar que el archivo esté en `C:\xampp\htdocs\biodiversity-app\local-api.php`

### Error: "Access denied"
- ✅ Verificar usuario MySQL: `root` sin contraseña (por defecto)
- ✅ Reiniciar MySQL desde XAMPP Control Panel

### Error CORS
- ✅ La API ya incluye headers CORS
- ✅ Verificar que la URL sea exactamente: `http://localhost/biodiversity-app/local-api.php/users`

## 🎯 **RESULTADO ESPERADO**

Después de la configuración:
- ✅ Registro de usuarios funciona desde la app
- ✅ Login funciona desde la app
- ✅ Datos se guardan en MySQL local
- ✅ Sin errores de CORS
- ✅ Sin dependencias de servidores remotos

## 📝 **CREDENCIALES DE PRUEBA**

Una vez configurado, puedes usar:
- Email: `erick@ieee.org`
- Contraseña: `erick123`
- Rol: `admin`
