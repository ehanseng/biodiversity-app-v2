# 🚀 Guía Rápida - Biodiversity App (Sin Supabase)

## ✅ Estado Actual

La aplicación ha sido **completamente liberada de Supabase** y ahora funciona con:
- ✅ Sistema de autenticación simple con localStorage
- ✅ Datos mock para desarrollo
- ✅ Compatible 100% con React Native Web
- ✅ Sin dependencias externas

## 🎯 Cómo Probar la Aplicación

### 1. Iniciar la Aplicación
```bash
npm run web
```

### 2. Abrir en el Navegador
La aplicación se abrirá automáticamente en: `http://localhost:8081`

### 3. Usuarios de Prueba
Usa cualquiera de estos usuarios para hacer login:

| Rol | Email | Password |
|-----|-------|----------|
| **Explorer** | `explorer@vibo.co` | `explorer123` |
| **Scientist** | `scientist@vibo.co` | `scientist123` |
| **Admin** | `admin@vibo.co` | `admin123` |

### 4. Funcionalidades Disponibles

#### 🏠 Pantalla Principal (Home)
- Información del usuario logueado
- Estadísticas mock
- Navegación a otras secciones

#### 🌳 Explorador (Explorer)
- Lista de árboles mock
- Botón para agregar nuevos árboles
- Filtros por estado

#### 🔬 Científico (Solo rol scientist)
- Pantalla de aprobación de árboles
- Datos mock para aprobar/rechazar

#### 🗺️ Mapa
- Mapa interactivo con Leaflet
- Marcadores de árboles y animales mock
- Funciona perfectamente en web

#### 👤 Perfil
- Información del usuario
- Botón para cerrar sesión

## 🔧 Próximos Pasos

### Para Producción con MySQL:
1. **Instalar XAMPP**
2. **Crear base de datos `biodiversity_app`**
3. **Configurar variables en `.env`**
4. **Crear backend API con Node.js + Express + MySQL**

### Estructura de BD Sugerida:
```sql
-- Usuarios
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role ENUM('explorer', 'scientist', 'admin'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Árboles
CREATE TABLE trees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    common_name VARCHAR(255),
    scientific_name VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    height_meters DECIMAL(5, 2),
    diameter_cm DECIMAL(5, 2),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

## 🎉 ¡Listo!

La aplicación ahora funciona completamente sin Supabase. Puedes:
- ✅ Hacer login con los usuarios de prueba
- ✅ Navegar por todas las pantallas
- ✅ Ver datos mock en tiempo real
- ✅ Probar todas las funcionalidades

**¡La aplicación está lista para desarrollo y testing!**
