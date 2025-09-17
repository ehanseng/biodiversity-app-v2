# 🔧 Solución de Problemas

## Error: "Database error querying schema"

Este error indica problemas con las políticas RLS de Supabase. Sigue estos pasos:

### Paso 1: Ejecutar Script de Corrección
En Supabase SQL Editor, ejecuta `fix_rls_policies.sql`

### Paso 2: Verificar Configuración
1. Ve a **Settings > API** en tu proyecto Supabase
2. Confirma que tu URL y API Key en `.env` coincidan exactamente

### Paso 3: Verificar Tablas
En Supabase, ve a **Table Editor** y confirma que existen:
- `profiles`
- `trees` 
- `animals`

### Paso 4: Verificar Usuarios
En **Authentication > Users**, confirma que existen los usuarios demo:
- explorer@demo.com
- scientist@demo.com
- admin@demo.com

### Paso 5: Probar Login
1. Reinicia la app: `npx expo start --web`
2. Intenta login con: `explorer@demo.com` / `password123`

## Otros Errores Comunes

### "Invalid login credentials"
- Verifica que ejecutaste `demo_data_simple.sql`
- Los usuarios deben existir en Authentication > Users

### "Network request failed"
- Verifica tu conexión a internet
- Confirma que la URL de Supabase es correcta

### Pantalla en blanco
- Abre Developer Tools (F12) y revisa la consola
- Busca errores de JavaScript o red
