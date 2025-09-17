# Configuración de Sesión Extendida en Supabase

## 📋 Configuración en Dashboard de Supabase

Para extender la duración de la sesión a 1 semana, sigue estos pasos:

### 1. Acceder al Dashboard
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión y selecciona tu proyecto
3. Ve a **Authentication** > **Settings**

### 2. Configurar JWT Settings
En la sección **JWT Settings**:

- **JWT expiry**: `604800` (7 días en segundos)
- **Refresh token rotation**: ✅ Habilitado (recomendado)
- **Reuse interval**: `10` (segundos)

### 3. Configurar Session Settings
En la sección **Session Settings**:

- **Session timeout**: `604800` (7 días en segundos)
- **Inactivity timeout**: `86400` (1 día en segundos)

### 4. Aplicar Cambios
1. Haz clic en **Save** para aplicar los cambios
2. Los cambios se aplicarán automáticamente a nuevas sesiones

## 🔧 Configuración en el Código

El archivo `src/config/supabase.js` ya está configurado con:

```javascript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: StorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    sessionRefreshMargin: 60, // Refrescar 60 segundos antes de expirar
    flowType: 'pkce',
  },
});
```

## ✅ Verificación

Para verificar que la configuración funciona:

1. Inicia sesión en la aplicación
2. Cierra la aplicación/navegador
3. Abre la aplicación después de varios días
4. La sesión debería mantenerse activa

## 🔄 Renovación Automática

- El token se renovará automáticamente cada 7 días
- Si el usuario está inactivo por más de 1 día, la sesión expirará
- El refresh token se rotará por seguridad
