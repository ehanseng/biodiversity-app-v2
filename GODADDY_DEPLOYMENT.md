# 🚀 Despliegue en GoDaddy cPanel - explora.ieeetadeo.org

Guía específica para desplegar tu app de biodiversidad en GoDaddy con cPanel.

## 📋 Información del Servidor
- **Dominio**: explora.ieeetadeo.org
- **Servidor**: GoDaddy Linux con cPanel
- **Servidor Web**: Apache
- **Acceso**: cPanel File Manager

## 🛠️ Paso a Paso - Despliegue

### 1. Preparar el Build Local

```bash
# Instalar dependencias (si no lo has hecho)
npm install

# Crear build para Windows
npm run build:prod:win
```

### 2. Verificar el Build

Después del build, deberías tener una carpeta `dist/` con:
- `index.html`
- Carpetas: `_expo/`, `assets/`
- Archivo `.htaccess` (para Apache)

### 3. Crear ZIP para Subir

```bash
# Navegar a la carpeta dist
cd dist

# Crear ZIP con todo el contenido
# En Windows, puedes usar el explorador de archivos:
# - Selecciona todo el contenido de la carpeta dist
# - Click derecho > "Enviar a" > "Carpeta comprimida"
# - Nombra el archivo: biodiversity-app.zip
```

### 4. Subir a GoDaddy cPanel

#### A. Acceder a cPanel
1. Ve a tu panel de GoDaddy
2. Busca "cPanel" y haz click
3. Busca "File Manager" y ábrelo

#### B. Navegar a la Carpeta Correcta
1. En File Manager, navega a `public_html`
2. Si tienes un subdirectorio para el dominio, ve a la carpeta correspondiente
3. **IMPORTANTE**: Para `explora.ieeetadeo.org`, probablemente sea:
   - `public_html/explora/` o
   - `public_html/` (si es el dominio principal)

#### C. Limpiar Contenido Anterior (si existe)
1. Selecciona todos los archivos existentes en la carpeta
2. Click en "Delete" para eliminarlos
3. Confirma la eliminación

#### D. Subir el ZIP
1. Click en "Upload" en la barra superior
2. Selecciona tu archivo `biodiversity-app.zip`
3. Espera a que se complete la subida
4. Regresa al File Manager

#### E. Extraer el ZIP
1. Busca el archivo `biodiversity-app.zip` en la lista
2. Click derecho > "Extract"
3. Selecciona la carpeta actual como destino
4. Click "Extract Files"
5. Elimina el archivo ZIP después de extraer

### 5. Configurar Variables de Entorno en cPanel

#### Opción A: Environment Variables (si está disponible)
1. En cPanel, busca "Environment Variables"
2. Agrega estas variables:
   - `EXPO_PUBLIC_SUPABASE_URL`: tu URL de Supabase
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: tu clave anónima
   - `EXPO_PUBLIC_ENVIRONMENT`: production

#### Opción B: Si no hay Environment Variables
Las variables ya están compiladas en el build, así que no es necesario configurarlas en el servidor.

### 6. Verificar Configuración de Apache

El archivo `.htaccess` ya debería estar en la raíz. Verifica que contiene:

```apache
RewriteEngine On
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

### 7. Configurar SSL/HTTPS

#### En GoDaddy cPanel:
1. Busca "SSL/TLS" en cPanel
2. Ve a "Let's Encrypt SSL"
3. Selecciona tu dominio `explora.ieeetadeo.org`
4. Click "Issue" para generar el certificado
5. Espera a que se active (puede tomar unos minutos)

#### Forzar HTTPS:
Agrega estas líneas al inicio de tu `.htaccess`:

```apache
# Force HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

### 8. Verificar el Despliegue

1. **Visita tu sitio**: https://explora.ieeetadeo.org
2. **Verifica funcionalidades**:
   - [ ] La página carga correctamente
   - [ ] No hay errores en la consola del navegador (F12)
   - [ ] La navegación funciona
   - [ ] El login/registro funciona
   - [ ] Las imágenes cargan correctamente

### 9. Troubleshooting Común

#### Problema: "404 Not Found" en rutas
**Solución**: Verifica que el archivo `.htaccess` esté en la raíz y tenga las reglas de rewrite.

#### Problema: "500 Internal Server Error"
**Solución**: 
- Verifica la sintaxis del `.htaccess`
- Revisa los logs de error en cPanel > "Error Logs"

#### Problema: Imágenes no cargan
**Solución**: 
- Verifica que los archivos se subieron correctamente
- Revisa los permisos de archivos (644 para archivos, 755 para carpetas)

#### Problema: App no conecta a Supabase
**Solución**: 
- Verifica que las variables de entorno estén correctas en tu `.env` local
- Asegúrate de que el build se hizo con las variables correctas

### 10. Actualizaciones Futuras

Para actualizar la app:

1. Hacer cambios en el código local
2. Ejecutar `npm run build:prod:win`
3. Crear nuevo ZIP del contenido de `dist/`
4. Subir y extraer en cPanel (reemplazando archivos existentes)

## 📱 Monitoreo

### Logs de Error:
- En cPanel > "Error Logs" para ver errores del servidor
- En el navegador > F12 > Console para errores de JavaScript

### Analytics:
- Considera agregar Google Analytics para monitorear el uso
- GoDaddy también ofrece estadísticas básicas en cPanel

---

## 🎯 Checklist Final

- [ ] Build creado exitosamente
- [ ] Archivos subidos a `public_html/`
- [ ] `.htaccess` configurado
- [ ] SSL activado
- [ ] Sitio accesible en https://explora.ieeetadeo.org
- [ ] Todas las funcionalidades probadas

¡Tu app de biodiversidad está lista en producción! 🌱
