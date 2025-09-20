# 🌐 Guía de Puertos y Servicios

## 📊 **Resumen de Servicios Activos**

| Servicio | Puerto | URL | Descripción | Estado |
|----------|--------|-----|-------------|--------|
| **Frontend** | 8081 | http://localhost:8081 | App React Native Web | ✅ Activo |
| **Backend API** | 3001 | http://localhost:3001/api | Servidor Express + API | ✅ Activo |
| **MySQL** | 3306 | localhost:3306 | Base de datos | ✅ Activo |
| **phpMyAdmin** | 80 | http://localhost/phpmyadmin | Administrador BD | ✅ Disponible |

## 🎯 **Cómo Acceder a Cada Servicio**

### 1. **🌐 Frontend (Puerto 8081)**
```
URL: http://localhost:8081
Qué es: Tu app de biodiversidad
Cómo usar: Abrir en navegador, hacer login, usar la app
```

### 2. **🗄️ Backend API (Puerto 3001)**
```
URL Base: http://localhost:3001/api
Qué es: Servidor que conecta la app con MySQL

Endpoints principales:
- http://localhost:3001/api/health (Estado del servidor)
- http://localhost:3001/api/records (Ver registros)
- http://localhost:3001/api/auth/login (Login)
```

### 3. **🗃️ MySQL (Puerto 3306)**
```
Puerto: 3306 (NO se accede por navegador)
Qué es: Base de datos donde se guardan los datos
Cómo ver: Usar phpMyAdmin o herramientas de BD
```

### 4. **🔧 phpMyAdmin (Puerto 80)**
```
URL: http://localhost/phpmyadmin
Qué es: Interface web para administrar MySQL
Usuario: root (sin contraseña)
Base de datos: biodiversity_db
```

## 🧪 **Pruebas que Puedes Hacer AHORA**

### ✅ **1. Verificar Frontend**
- Abrir: http://localhost:8081
- Login: explorer@vibo.co / explorer123
- Navegar por la app

### ✅ **2. Verificar Backend API**
- Abrir: http://localhost:3001/api/health
- Debería mostrar: `{"status":"OK",...}`

### ✅ **3. Ver Registros en API**
- Abrir: http://localhost:3001/api/records
- Debería mostrar: Array con 6 registros (árboles y animales)

### ✅ **4. Ver Base de Datos**
- Abrir: http://localhost/phpmyadmin
- Seleccionar: biodiversity_db
- Ver tablas: users, biodiversity_records

### ✅ **5. Probar MySQL Test desde la App**
- En la app (http://localhost:8081)
- Login como explorer
- HomeScreen → Botón "🗄️ Probar MySQL"
- Probar todas las funciones

## 🔍 **Diagnóstico de Problemas**

### ❌ **Si no puedes acceder al puerto 3001:**
```bash
# Verificar que el backend esté corriendo:
curl http://localhost:3001/api/health

# Si no responde, reiniciar backend:
cd backend
npm start
```

### ❌ **Si MySQL no funciona:**
```bash
# Verificar XAMPP:
# 1. Abrir XAMPP Control Panel
# 2. MySQL debe estar verde/running
# 3. Si no, hacer clic en "Start"

# Verificar conexión:
cd backend
node check-mysql.js
```

### ❌ **Si el frontend no carga:**
```bash
# Verificar puerto 8081:
netstat -an | findstr :8081

# Si está ocupado, matar proceso y reiniciar:
npx expo start --web
```

## 📋 **Datos de Prueba Disponibles**

### 👥 **Usuarios**
- explorer@vibo.co / explorer123
- scientist@vibo.co / scientist123  
- admin@vibo.co / admin123

### 🌳 **Registros de Flora**
- Ceiba del Campus (aprobado)
- Guayacán Amarillo (pendiente)
- Nogal Cafetero (rechazado)

### 🦋 **Registros de Fauna**
- Colibrí Esmeralda (aprobado)
- Ardilla Común (pendiente)
- Mariposa Monarca (aprobado)

## 🎉 **Todo Está Funcionando**

✅ **MySQL en puerto 3306**: Base de datos activa con 6 registros
✅ **Backend en puerto 3001**: API funcionando correctamente  
✅ **Frontend en puerto 8081**: App web disponible
✅ **phpMyAdmin en puerto 80**: Administrador de BD disponible

**¡Puedes usar cualquiera de estos servicios para interactuar con tu app de biodiversidad!** 🌳🦋
