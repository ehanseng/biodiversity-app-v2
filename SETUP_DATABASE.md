# 🗄️ Configuración de Base de Datos Supabase

## Paso 1: Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Anota tu **URL del proyecto** y **API Key (anon public)**

## Paso 2: Configurar variables de entorno

Actualiza tu archivo `.env` con los datos de tu proyecto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-api-key-aqui
EXPO_PUBLIC_ENVIRONMENT=development
```

## Paso 3: Ejecutar el schema SQL

1. En tu proyecto Supabase, ve a **SQL Editor**
2. Copia y pega todo el contenido de `supabase_schema.sql`
3. Ejecuta el script (botón **Run**)

Esto creará:
- ✅ Tablas: `profiles`, `trees`, `animals`
- ✅ Políticas de seguridad (RLS)
- ✅ Trigger para crear perfiles automáticamente

## Paso 4: Crear usuarios de prueba

Ve a **Authentication > Users** en Supabase y crea estos usuarios:

### 🔍 Explorer
- **Email**: `explorer@test.com`
- **Contraseña**: `password123`
- **Metadata**: `{"full_name": "Ana Explorer"}`

### 🔬 Scientist  
- **Email**: `scientist@test.com`
- **Contraseña**: `password123`
- **Metadata**: `{"full_name": "Dr. Carlos Scientist"}`

### 👑 Admin
- **Email**: `admin@test.com` 
- **Contraseña**: `password123`
- **Metadata**: `{"full_name": "Maria Admin"}`

## Paso 5: Actualizar roles de usuarios

Después de crear los usuarios, ejecuta este SQL para asignar roles:

```sql
-- Actualizar roles (ejecutar después de crear usuarios)
UPDATE public.profiles SET role = 'explorer' WHERE email = 'explorer@test.com';
UPDATE public.profiles SET role = 'scientist' WHERE email = 'scientist@test.com';
UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@test.com';
```

## Paso 6: Agregar datos de prueba (opcional)

Una vez que tengas usuarios creados, puedes agregar datos de prueba:

```sql
-- Obtener IDs de usuarios creados
SELECT id, email FROM public.profiles;

-- Insertar árboles de prueba (reemplaza los UUIDs con los IDs reales)
INSERT INTO public.trees (user_id, common_name, scientific_name, description, latitude, longitude, location_description, height_meters, status) VALUES
    ((SELECT id FROM public.profiles WHERE email = 'explorer@test.com'), 'Ceiba', 'Ceiba pentandra', 'Árbol sagrado maya de gran tamaño', 19.4326, -99.1332, 'Parque Chapultepec, CDMX', 25.5, 'approved'),
    ((SELECT id FROM public.profiles WHERE email = 'explorer@test.com'), 'Ahuehuete', 'Taxodium mucronatum', 'Árbol nacional de México', 19.4284, -99.1276, 'Bosque de Chapultepec', 30.2, 'approved'),
    ((SELECT id FROM public.profiles WHERE email = 'scientist@test.com'), 'Jacaranda', 'Jacaranda mimosifolia', 'Árbol ornamental con flores moradas', 19.4320, -99.1330, 'Colonia Roma Norte', 12.8, 'pending');
```

## Paso 7: Probar la aplicación

```bash
npx expo start --web
```

Ahora puedes:
- 🔐 Hacer login con cualquier usuario de prueba
- 📊 Ver estadísticas en el dashboard
- 🗺️ Ver árboles aprobados en el mapa
- ➕ Registrar nuevos árboles/animales

## ⚠️ Nota importante

Los usuarios deben crearse primero en **Authentication > Users** antes de poder insertar datos en las tablas, debido a las restricciones de clave foránea con `auth.users`.
