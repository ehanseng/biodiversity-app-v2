# 🚨 Solución Rápida - Error 500 de Autenticación

El error 500 indica que los usuarios demo no existen en Supabase Auth. Aquí está la solución más simple:

## Opción 1: Crear Usuario Manualmente (Más Rápido)

1. **Ve a Supabase Dashboard** > Authentication > Users
2. **Haz clic en "Add user"**
3. **Crea un usuario:**
   - Email: `test@demo.com`
   - Password: `password123`
   - Confirm password: `password123`
4. **Guarda el usuario**

## Opción 2: Registrarse en la App

1. **En la app web**, haz clic en "Registrarse"
2. **Completa el formulario:**
   - Email: tu email real
   - Password: cualquier contraseña
   - Nombre: tu nombre
   - Rol: Explorer
3. **Haz clic en Registrar**

## Opción 3: Usar Datos Demo Existentes

Si ya tienes árboles y animales en la base de datos:

1. **Ejecuta este SQL** en Supabase:
```sql
-- Ver si hay datos
SELECT COUNT(*) FROM public.trees;
SELECT COUNT(*) FROM public.animals;
```

2. **Si hay datos**, simplemente regístrate normalmente en la app

## ✅ Después de crear el usuario:

1. **Haz login** con las credenciales que creaste
2. **Verás el dashboard** con estadísticas
3. **Podrás navegar** por todas las secciones

La app funcionará perfectamente una vez que tengas un usuario válido en Supabase Auth.
