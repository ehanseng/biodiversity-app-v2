# 🌱 Biodiversity App V2

Una aplicación de biodiversidad construida con React Native y Expo, **SIN dependencias externas como Supabase**.

## 🚀 Características

- ✅ **Sin Supabase**: Sistema de autenticación simple con localStorage
- ✅ **Compatible con XAMPP**: Preparado para MySQL local y remoto
- ✅ **Usuarios Mock**: Sistema de desarrollo con usuarios predefinidos
- ✅ **Web Compatible**: Funciona perfectamente en navegadores web

## 👥 Usuarios de Prueba

Para desarrollo, puedes usar estos usuarios:

- **Explorer**: `explorer@vibo.co` / `explorer123`
- **Scientist**: `scientist@vibo.co` / `scientist123`  
- **Admin**: `admin@vibo.co` / `admin123`

## 🛠️ Instalación

1. Clona el repositorio
2. Instala las dependencias: `npm install`
3. Copia `.env.example` a `.env` (opcional para desarrollo)
4. Inicia la aplicación: `npm run web`

## 🌐 Desarrollo Web

```bash
npm run web
```

La aplicación se abrirá en `http://localhost:8081`

## 🗄️ Base de Datos (Futuro)

El proyecto está preparado para usar MySQL con XAMPP:

1. Instala XAMPP
2. Crea la base de datos `biodiversity_app`
3. Configura las variables en `.env`
4. El backend API se conectará automáticamente

## 📁 Estructura del Proyecto

```
/src
  /contexts     - Contextos de React (AuthContext)
  /screens      - Pantallas de la aplicación
  /components   - Componentes reutilizables
  /services     - Servicios y APIs
```

## 🚀 Despliegue

Ver `DEPLOYMENT_GUIDE.md` para instrucciones detalladas de despliegue.
