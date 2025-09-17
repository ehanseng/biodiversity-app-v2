# 🌱 Biodiversity Data Collection App

Una aplicación web React Native para la recolección de datos de biodiversidad con sistema de roles y aprobación científica.

## 🚀 Características

- 🔐 **Autenticación de usuarios** con roles (Explorador, Científico, Administrador)
- 🌳 **Registro de árboles** con ubicación GPS e imágenes
- 🗺️ **Mapa interactivo** con visualización de datos aprobados
- ✅ **Sistema de aprobación** científica para validar datos
- 📊 **Dashboard** con estadísticas personalizadas por rol
- 🌐 **Multiplataforma** - Web, iOS y Android

## 🛠️ Tecnologías

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Mapas**: React Native Maps / Leaflet (web)
- **Despliegue**: Netlify

## 🏗️ Instalación Local

1. **Clonar el repositorio**
```bash
git clone <tu-repo-url>
cd biodiversity-app-v2
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de Supabase
```

4. **Ejecutar la aplicación**
```bash
# Para web
npm run web

# Para móvil
npm start
```

## 🌐 Despliegue en Netlify

### Paso 1: Preparar el repositorio en GitHub

1. **Crear un nuevo repositorio en GitHub**
2. **Subir el código**:
```bash
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/tu-usuario/biodiversity-app-v2.git
git push -u origin main
```

### Paso 2: Configurar Netlify

1. **Conectar con GitHub**:
   - Ve a [Netlify](https://netlify.com)
   - Haz clic en "New site from Git"
   - Conecta tu cuenta de GitHub
   - Selecciona tu repositorio `biodiversity-app-v2`

2. **Configuración de build**:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Node version**: `18`

3. **Variables de entorno**:
   Ve a Site settings > Environment variables y agrega:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   EXPO_PUBLIC_ENVIRONMENT=production
   ```

4. **Desplegar**:
   - Haz clic en "Deploy site"
   - Netlify construirá y desplegará automáticamente tu aplicación

### Paso 3: Configurar dominio personalizado (opcional)

1. Ve a Site settings > Domain management
2. Agrega tu dominio personalizado
3. Configura los DNS según las instrucciones de Netlify

## 🗄️ Base de Datos

La aplicación usa Supabase con las siguientes tablas:

- **profiles**: Perfiles de usuario con roles
- **trees**: Datos de árboles con ubicación e imágenes
- **animals**: Datos de animales (estructura similar a trees)

### Configurar Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL en `supabase_schema.sql`
3. Configura las políticas RLS (Row Level Security)
4. Obtén tu URL y clave anónima del proyecto

## 👥 Roles de Usuario

### 🔍 Explorador
- Registrar nuevos árboles y animales
- Ver sus propios datos
- Editar datos pendientes

### 🔬 Científico
- Todas las funciones de explorador
- Aprobar/rechazar datos enviados
- Ver datos de todos los usuarios

### 👑 Administrador
- Todas las funciones anteriores
- Gestionar usuarios
- Acceso completo al sistema

## 🚀 Scripts Disponibles

```bash
npm start          # Iniciar servidor de desarrollo
npm run web        # Ejecutar en navegador web
npm run android    # Ejecutar en Android
npm run ios        # Ejecutar en iOS
npm run build      # Construir para producción web
npm run preview    # Vista previa de la build local
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Si tienes problemas:

1. Revisa la [documentación de Expo](https://docs.expo.dev/)
2. Consulta la [documentación de Supabase](https://supabase.com/docs)
3. Abre un issue en este repositorio

---

Desarrollado con ❤️ para la conservación de la biodiversidad
