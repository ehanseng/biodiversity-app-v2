# 🔐 Guía de Configuración del Login con MySQL

## ✅ Sistema Implementado

Hemos configurado un sistema de autenticación híbrido que **prioriza MySQL** sobre localStorage:

### 🏗️ Arquitectura
- **MySQL First**: Siempre intenta autenticar en MySQL primero
- **localStorage Fallback**: Solo usa localStorage si MySQL no está disponible
- **Sincronización Automática**: Los datos se sincronizan entre sistemas

### 📁 Archivos Modificados
- `src/contexts/NewAuthContext.js` - Contexto de autenticación
- `src/services/HybridUserService.js` - Servicio híbrido (MySQL + localStorage)
- `src/services/UserMySQLService.js` - Cliente API MySQL
- `src/screens/LoginScreen.js` - Pantalla de login con botones de debug
- `backend/biodiversity-final.php` - API PHP con endpoints de usuarios
- `backend/setup-users-table.php` - Script para crear usuarios de prueba
- `backend/test-login.php` - Script de prueba del sistema

## 🚀 Pasos para Probar

### 1. Configurar Base de Datos
```bash
# Ejecutar en el servidor web (XAMPP/servidor remoto)
php backend/setup-users-table.php
```

### 2. Verificar Configuración
```bash
# Abrir en navegador para verificar
http://localhost/biodiversity-app/test-login.php
# O en servidor remoto:
https://explora.ieeetadeo.org/test-login.php
```

### 3. Probar desde la App
1. Ejecutar la app: `npm start`
2. Ir a la pantalla de Login
3. Usar botón "🌐 Probar Conexión MySQL" para verificar servidor
4. Usar botón "🐛 Ver Usuarios Registrados" para ver usuarios disponibles

## 👥 Usuarios de Prueba Creados

| Email | Contraseña | Rol | Descripción |
|-------|------------|-----|-------------|
| `admin@biodiversidad.com` | `admin123` | admin | Administrador del sistema |
| `scientist@biodiversidad.com` | `scientist123` | scientist | Científico validador |
| `explorer@biodiversidad.com` | `explorer123` | explorer | Explorador recolector |
| `test@test.com` | `test123` | explorer | Usuario de prueba |

## 🔧 Configuración de Servidor

### URL del Servidor MySQL
La app está configurada para usar:
```
https://explora.ieeetadeo.org/biodiversity-app.php/api
```

### Endpoints Disponibles
- `GET /api/health` - Estado del servidor
- `GET /api/users` - Listar usuarios
- `POST /api/users` - Crear usuario
- `POST /api/users/login` - Login de usuario
- `POST /api/users/check-email` - Verificar email

## 🧪 Proceso de Login

1. **Usuario ingresa credenciales** en LoginScreen
2. **HybridUserService** intenta login en MySQL primero
3. **Si MySQL funciona**: Autentica y actualiza cache local
4. **Si MySQL falla**: Usa localStorage como fallback
5. **AuthContext** maneja el estado de autenticación
6. **Navegación automática** al HomeScreen si es exitoso

## 🐛 Debug y Troubleshooting

### Botones de Debug en LoginScreen
- **🐛 Ver Usuarios Registrados**: Muestra usuarios híbridos (MySQL + local)
- **🌐 Probar Conexión MySQL**: Verifica conectividad al servidor
- **🔄 Sincronizar**: Sincroniza usuarios locales con MySQL

### Logs en Consola
Buscar en la consola del navegador:
```
🔍 [HybridUserService] Buscando usuario para login
🌐 [HybridUserService] Intentando login en MySQL
✅ [HybridUserService] Login exitoso en MySQL
```

### Errores Comunes
1. **Error de conexión**: Verificar URL del servidor
2. **Credenciales inválidas**: Verificar que el usuario existe en MySQL
3. **CORS**: Verificar headers en biodiversity-final.php

## 📊 Estado Actual

✅ **Completado**:
- API PHP con endpoints de usuarios
- Servicio híbrido MySQL + localStorage
- Sistema de autenticación prioriza MySQL
- Pantalla de login con debug
- Usuarios de prueba creados
- Scripts de configuración y prueba

🔄 **En Progreso**:
- Pruebas de login con usuarios reales
- Verificación de sincronización

## 🎯 Próximos Pasos

1. **Ejecutar setup-users-table.php** para crear usuarios
2. **Probar conexión MySQL** desde la app
3. **Hacer login** con usuarios de prueba
4. **Verificar navegación** al HomeScreen
5. **Confirmar datos específicos por usuario**

---

💡 **Tip**: Usa las credenciales `test@test.com / test123` para pruebas rápidas.
