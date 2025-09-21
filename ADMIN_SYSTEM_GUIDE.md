# 🔧 Guía del Sistema de Administración

## Descripción General

El sistema de administración permite a los usuarios con rol `admin` gestionar todos los usuarios de la plataforma de biodiversidad. Los administradores pueden:

- Ver lista completa de usuarios
- Editar información de usuarios
- Cambiar roles de usuarios
- Activar/desactivar usuarios
- Eliminar usuarios (soft delete)
- Ver estadísticas del sistema

## 🎭 Roles de Usuario

### 🌱 Explorer (Explorador)
- **Permisos**: Registrar plantas y animales, ver sus propios registros
- **Descripción**: Usuario básico que puede contribuir con datos de biodiversidad

### 🔬 Scientist (Científico)
- **Permisos**: Todos los permisos de Explorer + aprobar/rechazar registros
- **Descripción**: Usuario con conocimientos científicos que valida los registros

### ⚙️ Admin (Administrador)
- **Permisos**: Acceso completo al sistema + gestión de usuarios
- **Descripción**: Usuario con control total sobre la plataforma

## 🖥️ Interfaz de Administración

### Panel Principal
- **Header verde**: Título y descripción del panel
- **Estadísticas**: Cards horizontales con métricas clave
- **Búsqueda**: Campo para filtrar usuarios por email o nombre
- **Lista de usuarios**: Cards con información detallada y acciones

### Estadísticas Disponibles
- 👥 **Total Usuarios**: Cantidad total de usuarios registrados
- ✅ **Activos**: Usuarios con estado activo
- 🌱 **Exploradores**: Usuarios con rol explorer
- 🔬 **Científicos**: Usuarios con rol scientist
- ⚙️ **Admins**: Usuarios con rol admin

### Información por Usuario
- **Datos básicos**: Nombre completo, email, rol, estado
- **Estadísticas**: Cantidad de árboles y animales registrados
- **Metadatos**: Fecha de registro, última actualización
- **Acciones**: Editar, activar/desactivar, eliminar

## 🛠️ Funcionalidades

### ✏️ Editar Usuario
- **Modal intuitivo** con formulario completo
- **Campos editables**: Email, nombre completo, rol
- **Selector de rol** con descripciones visuales
- **Validación**: Email válido, campos requeridos
- **Información adicional**: ID, fecha de registro, estadísticas

### 🔄 Cambiar Estado
- **Activar/Desactivar** usuarios
- **Confirmación** antes de realizar cambios
- **Actualización inmediata** en la interfaz
- **Feedback visual** del estado actual

### 🗑️ Eliminar Usuario
- **Soft delete**: Los datos se mantienen pero se marcan como eliminados
- **Protección**: No se puede eliminar la propia cuenta
- **Confirmación doble** para evitar eliminaciones accidentales
- **Actualización inmediata** de la lista

### 🔍 Búsqueda y Filtros
- **Búsqueda en tiempo real** por email o nombre
- **Limpieza rápida** del filtro con botón X
- **Resultados instantáneos** sin recargar

## 🔧 Configuración Técnica

### Archivos Principales

#### Frontend
```
src/screens/AdminScreen.js          # Pantalla principal de administración
src/components/UserEditModal.js     # Modal para editar usuarios
src/services/UserManagementService.js # Servicio para operaciones CRUD
```

#### Backend
```
backend/admin-users-endpoint.php    # API REST para administración
backend/add-deleted-at-column.php   # Script para agregar columna deleted_at
backend/test-admin-endpoint.php     # Script de pruebas del endpoint
```

### Base de Datos

#### Tabla: `users`
```sql
-- Columnas requeridas para el sistema de administración
id INT PRIMARY KEY AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
full_name VARCHAR(255) NOT NULL
role ENUM('explorer', 'scientist', 'admin') DEFAULT 'explorer'
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
deleted_at TIMESTAMP NULL DEFAULT NULL  -- Para soft delete
```

### API Endpoints

#### GET `/api/admin/users`
- **Descripción**: Obtener todos los usuarios
- **Respuesta**: Lista de usuarios con estadísticas

#### GET `/api/admin/users/search?q={query}`
- **Descripción**: Buscar usuarios por email o nombre
- **Parámetros**: `q` - término de búsqueda

#### PUT `/api/admin/users/{id}`
- **Descripción**: Actualizar información de usuario
- **Body**: `{ email, full_name, role }`

#### PUT `/api/admin/users/{id}/role`
- **Descripción**: Cambiar rol de usuario
- **Body**: `{ role: 'explorer|scientist|admin' }`

#### PUT `/api/admin/users/{id}/status`
- **Descripción**: Activar/desactivar usuario
- **Body**: `{ is_active: true|false }`

#### DELETE `/api/admin/users/{id}`
- **Descripción**: Eliminar usuario (soft delete)
- **Efecto**: Marca `deleted_at` con timestamp actual

#### GET `/api/admin/stats/users`
- **Descripción**: Obtener estadísticas de usuarios
- **Respuesta**: Métricas agregadas del sistema

## 🚀 Instalación y Configuración

### 1. Preparar Base de Datos
```bash
# Ejecutar script para agregar columna deleted_at
php backend/add-deleted-at-column.php
```

### 2. Configurar Endpoint
- Subir `admin-users-endpoint.php` al servidor
- Verificar configuración de base de datos
- Probar con `test-admin-endpoint.php`

### 3. Verificar Permisos
- Asegurar que el usuario admin tenga acceso al tab Admin
- Verificar que la navegación condicional funcione
- Probar todas las funcionalidades en el frontend

### 4. Pruebas
```bash
# Ejecutar script de pruebas
php backend/test-admin-endpoint.php
```

## 🔒 Seguridad

### Validaciones Implementadas
- **Autenticación**: Solo usuarios admin pueden acceder
- **Autorización**: Verificación de rol en frontend y backend
- **Validación de datos**: Email válido, campos requeridos
- **Protección de cuenta**: No se puede eliminar la propia cuenta
- **Soft delete**: Los datos no se pierden permanentemente

### Recomendaciones
- **Logs de auditoría**: Registrar todas las acciones administrativas
- **Backup regular**: Respaldar base de datos antes de cambios masivos
- **Acceso limitado**: Minimizar cantidad de usuarios admin
- **Monitoreo**: Supervisar actividad administrativa

## 🐛 Solución de Problemas

### Error: "No se pudieron cargar los usuarios"
- Verificar conexión a base de datos
- Revisar configuración del endpoint PHP
- Comprobar permisos de usuario MySQL

### Error: "Usuario no encontrado"
- Verificar que el ID del usuario sea válido
- Comprobar que el usuario no esté eliminado (`deleted_at IS NULL`)

### Error: "Rol inválido"
- Verificar que el rol sea uno de: `explorer`, `scientist`, `admin`
- Revisar validación en frontend y backend

### Modal no se abre
- Verificar que `UserEditModal` esté importado correctamente
- Comprobar estado `editModalVisible` y `selectedUser`

## 📈 Métricas y Monitoreo

### Estadísticas Disponibles
- Total de usuarios por rol
- Usuarios activos vs inactivos
- Registros nuevos por período
- Contenido generado por usuarios

### Logs Recomendados
- Cambios de rol de usuarios
- Activaciones/desactivaciones
- Eliminaciones de usuarios
- Búsquedas administrativas

## 🔄 Actualizaciones Futuras

### Funcionalidades Sugeridas
- **Logs de auditoría**: Historial de cambios administrativos
- **Exportación de datos**: CSV/Excel de usuarios
- **Notificaciones**: Alertas por email de cambios importantes
- **Roles personalizados**: Permisos más granulares
- **Dashboard avanzado**: Gráficos y métricas detalladas

### Mejoras Técnicas
- **Paginación**: Para listas grandes de usuarios
- **Filtros avanzados**: Por rol, estado, fecha de registro
- **Bulk operations**: Acciones masivas en múltiples usuarios
- **API versioning**: Versionado de endpoints
- **Rate limiting**: Protección contra abuso de API

---

## 📞 Soporte

Para problemas técnicos o preguntas sobre el sistema de administración:

1. Revisar logs del servidor y navegador
2. Verificar configuración de base de datos
3. Probar endpoints con script de pruebas
4. Consultar documentación de la API

**¡El sistema de administración está listo para gestionar usuarios de manera eficiente y segura!** 🎉
