# 🔧 Configuración CORS para Admin Panel

## Problema Actual

El AdminScreen está usando datos **mock temporales** porque el servidor remoto no tiene configurados los endpoints de administración ni CORS adecuado.

**Error actual:**
```
Access to fetch at 'https://explora.ieeetadeo.org/api/admin/stats/users' from origin 'http://localhost:8081' has been blocked by CORS policy
```

## ✅ Solución Temporal (Actual)

He configurado el `UserManagementService` para usar **datos mock** mientras configuras el servidor:

```javascript
// En UserManagementService.js
this.useMockData = true; // ← Cambiar a false cuando el servidor esté listo
```

### Datos Mock Incluidos:
- **5 usuarios de prueba** con diferentes roles
- **Estadísticas calculadas** automáticamente
- **Simulación de delays** de red realistas
- **Funcionalidad completa** de edición, activar/desactivar, eliminar

## 🚀 Para Activar Servidor Real

### 1. Subir Archivos al Servidor

Subir estos archivos a `https://explora.ieeetadeo.org/`:

```
backend/admin-users-endpoint.php → /api/admin/users
backend/add-deleted-at-column.php → /scripts/
```

### 2. Configurar Base de Datos

```bash
# Ejecutar en el servidor remoto
php /scripts/add-deleted-at-column.php
```

### 3. Configurar CORS

Agregar estas líneas al **inicio** de `admin-users-endpoint.php`:

```php
<?php
// CORS Headers - DEBE estar al inicio del archivo
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Resto del código...
```

### 4. Configurar Rutas del Servidor

El endpoint debe responder a estas rutas:

```
GET  /api/admin/users              → Obtener todos los usuarios
GET  /api/admin/users/search?q=... → Buscar usuarios
GET  /api/admin/stats/users        → Estadísticas de usuarios
PUT  /api/admin/users/{id}         → Actualizar usuario
PUT  /api/admin/users/{id}/role    → Cambiar rol
PUT  /api/admin/users/{id}/status  → Activar/desactivar
DELETE /api/admin/users/{id}       → Eliminar usuario
```

### 5. Probar Configuración

```bash
# Ejecutar script de pruebas
php backend/test-admin-endpoint.php
```

### 6. Activar en Frontend

Una vez que el servidor esté configurado:

```javascript
// En src/services/UserManagementService.js
constructor() {
    this.baseUrl = 'https://explora.ieeetadeo.org/api';
    this.useMockData = false; // ← Cambiar a false
}
```

## 🔍 Verificar Funcionamiento

### Logs Esperados (Mock):
```
🔧 [UserManagement] Usando datos mock para desarrollo
✅ [UserManagement] Usuarios mock obtenidos: 5
🔧 [UserManagement] Usando estadísticas mock para desarrollo
```

### Logs Esperados (Servidor Real):
```
👥 [UserManagement] Obteniendo todos los usuarios...
✅ [UserManagement] Usuarios obtenidos: X
📊 [UserManagement] Obteniendo estadísticas de usuarios...
✅ [UserManagement] Estadísticas obtenidas: {...}
```

## 🛠️ Configuración Nginx (Si Aplica)

Si usas Nginx, agregar esta configuración:

```nginx
location /api/admin/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, X-Requested-With";
    
    if ($request_method = 'OPTIONS') {
        return 200;
    }
    
    try_files $uri $uri/ /api/admin-users-endpoint.php?$query_string;
}
```

## 🐛 Debugging

### Si el AdminScreen no carga:
1. Verificar que `useMockData = true` en UserManagementService
2. Revisar consola del navegador para errores
3. Verificar que el usuario tenga rol 'admin'

### Si hay errores CORS:
1. Verificar headers CORS en el archivo PHP
2. Comprobar que el servidor responde a OPTIONS
3. Revisar configuración del servidor web

### Si los datos no se actualizan:
1. Verificar que las rutas del servidor sean correctas
2. Comprobar que la base de datos tenga la columna `deleted_at`
3. Revisar logs del servidor PHP

## 📋 Checklist de Configuración

- [ ] Archivos PHP subidos al servidor
- [ ] Base de datos actualizada (columna deleted_at)
- [ ] Headers CORS configurados
- [ ] Rutas del servidor funcionando
- [ ] Script de pruebas ejecutado exitosamente
- [ ] useMockData cambiado a false
- [ ] AdminScreen funcionando con datos reales

---

**Estado Actual:** ✅ Funcionando con datos mock
**Próximo Paso:** 🚀 Configurar servidor remoto para datos reales
